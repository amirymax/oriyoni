import re
from datetime import datetime, timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from accounts.tests.conftest import PASSWORD

User = get_user_model()

pytestmark = pytest.mark.django_db

REGISTER = "/api/auth/register/"
VERIFY = "/api/auth/email/verify/"
RESEND = "/api/auth/email/verify/resend/"
LOGIN = "/api/auth/login/"

SIGNUP = {"email": "grace@example.com", "password": "correct-horse-battery"}


def credentials_from_outbox():
    """Pull uid/token back out of the most recently sent email."""
    body = mail.outbox[-1].body
    match = re.search(r"uid=([^&\s]+)&token=([^\s]+)", body)
    assert match, body
    return {"uid": match.group(1), "token": match.group(2)}


def _travel(monkeypatch, hours):
    """Move the token generator's clock forward, to age a link without waiting."""
    from accounts.tokens import email_verification_token_generator

    later = datetime.now() + timedelta(hours=hours)
    monkeypatch.setattr(email_verification_token_generator, "_now", lambda: later)


class TestRegister:
    def test_signup_mails_a_confirmation_link(self, api):
        response = api.post(REGISTER, SIGNUP, format="json")

        assert response.status_code == 201
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == [SIGNUP["email"]]
        assert "/verify-email?" in mail.outbox[0].body

    def test_the_new_account_starts_unconfirmed_and_signed_in(self, api):
        response = api.post(REGISTER, SIGNUP, format="json")

        assert response.data["email_verified"] is False
        # Soft verification: the session is issued regardless.
        assert User.objects.get(email=SIGNUP["email"]).email_verified_at is None

    def test_email_is_written_in_the_requested_language(self, api):
        api.post(REGISTER, {**SIGNUP, "language": "ru"}, format="json")

        assert "ORIYONI" in mail.outbox[0].subject
        assert "Подтвердите" in mail.outbox[0].subject

    def test_language_defaults_to_english(self, api):
        api.post(REGISTER, SIGNUP, format="json")

        assert mail.outbox[0].subject == "Confirm your ORIYONI email"

    def test_language_is_not_stored_on_the_account(self, api):
        api.post(REGISTER, {**SIGNUP, "language": "ru"}, format="json")

        assert not hasattr(User.objects.get(email=SIGNUP["email"]), "language")

    def test_an_unsendable_email_does_not_cost_the_signup(self, api):
        """The account is saved by then, so failing here would strand it."""
        from unittest.mock import patch

        with patch("accounts.emails.send_mail", side_effect=OSError("smtp down")):
            response = api.post(REGISTER, SIGNUP, format="json")

        assert response.status_code == 201
        assert User.objects.filter(email=SIGNUP["email"]).exists()

    def test_a_rejected_signup_sends_nothing(self, api, user):
        response = api.post(REGISTER, {"email": user.email, "password": PASSWORD}, format="json")

        assert response.status_code == 400
        assert mail.outbox == []


class TestVerify:
    def test_following_the_link_confirms_the_address(self, api):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 200
        assert response.data["email_verified"] is True
        assert User.objects.get(email=SIGNUP["email"]).email_verified_at is not None

    def test_confirming_signs_the_browser_in(self, api):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        api.cookies.clear()

        api.post(VERIFY, credentials, format="json")
        me = api.get("/api/auth/me/")

        assert me.status_code == 200
        assert me.data["email"] == SIGNUP["email"]

    def test_a_link_cannot_be_used_twice(self, api):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        api.post(VERIFY, credentials, format="json")

        second = api.post(VERIFY, credentials, format="json")

        assert second.status_code == 400
        assert "token" in second.data["errors"]

    def test_signing_in_elsewhere_leaves_the_link_working(self, api):
        """The whole reason this token is not Django's reset token.

        A confirmation email sits unread while its owner carries on browsing,
        so a sign-in on another device must not quietly kill it.
        """
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        api.post(LOGIN, {"email": SIGNUP["email"], "password": SIGNUP["password"]}, format="json")

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 200

    def test_changing_the_password_leaves_the_link_working(self, api):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        user = User.objects.get(email=SIGNUP["email"])
        user.set_password("an-entirely-different-secret")
        user.save(update_fields=["password"])

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 200

    def test_a_tampered_token_is_rejected(self, api):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        credentials["token"] = credentials["token"][:-1] + "x"

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 400
        assert User.objects.get(email=SIGNUP["email"]).email_verified_at is None

    def test_a_token_for_another_account_is_rejected(self, api, user):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        credentials["uid"] = urlsafe_base64_encode(force_bytes(user.pk))

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email_verified_at is None

    def test_a_password_reset_token_is_not_accepted_here(self, api, user):
        """Distinct salts, so the two link types cannot be swapped."""
        from django.contrib.auth.tokens import default_token_generator

        response = api.post(
            VERIFY,
            {
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "token": default_token_generator.make_token(user),
            },
            format="json",
        )

        assert response.status_code == 400

    def test_a_nonsense_uid_is_rejected(self, api):
        response = api.post(VERIFY, {"uid": "!!!", "token": "whatever"}, format="json")

        assert response.status_code == 400

    def test_a_link_still_works_a_day_later(self, api, monkeypatch):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        _travel(monkeypatch, hours=24)

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 200

    def test_a_link_expires_eventually(self, api, monkeypatch):
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        _travel(monkeypatch, hours=49)

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 400
        assert User.objects.get(email=SIGNUP["email"]).email_verified_at is None

    def test_a_link_outlives_the_password_reset_window(self, api, settings):
        """The two budgets are separate; a short reset window must not bite."""
        api.post(REGISTER, SIGNUP, format="json")
        credentials = credentials_from_outbox()
        settings.PASSWORD_RESET_TIMEOUT = 0

        response = api.post(VERIFY, credentials, format="json")

        assert response.status_code == 200


class TestResend:
    def test_sends_a_fresh_link_to_an_unconfirmed_address(self, api, user):
        response = api.post(RESEND, {"email": user.email}, format="json")

        assert response.status_code == 200
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == [user.email]

    def test_the_fresh_link_works(self, api, user):
        api.post(RESEND, {"email": user.email}, format="json")

        response = api.post(VERIFY, credentials_from_outbox(), format="json")

        assert response.status_code == 200

    def test_a_confirmed_address_gets_the_same_answer_and_no_email(self, api, user):
        user.email_verified_at = timezone.now()
        user.save(update_fields=["email_verified_at"])

        confirmed = api.post(RESEND, {"email": user.email}, format="json")
        unknown = api.post(RESEND, {"email": "nobody@example.com"}, format="json")

        assert confirmed.status_code == 200
        assert confirmed.data == unknown.data
        assert mail.outbox == []

    def test_unknown_address_gets_the_same_answer_and_no_email(self, api, user):
        unknown = api.post(RESEND, {"email": "nobody@example.com"}, format="json")
        found = api.post(RESEND, {"email": user.email}, format="json")

        assert unknown.status_code == 200
        assert unknown.data == found.data

    def test_address_is_matched_case_insensitively(self, api, user):
        api.post(RESEND, {"email": "ADA@Example.com"}, format="json")

        assert len(mail.outbox) == 1

    def test_deactivated_account_gets_no_email(self, api, user):
        user.is_active = False
        user.save(update_fields=["is_active"])

        response = api.post(RESEND, {"email": user.email}, format="json")

        assert response.status_code == 200
        assert mail.outbox == []

    def test_email_is_written_in_the_requested_language(self, api, user):
        api.post(RESEND, {"email": user.email, "language": "ru"}, format="json")

        assert "Подтвердите" in mail.outbox[0].subject

    def test_link_points_at_the_storefront(self, api, user, settings):
        api.post(RESEND, {"email": user.email}, format="json")

        assert settings.FRONTEND_URL in mail.outbox[0].body
        assert "/verify-email?" in mail.outbox[0].body

    def test_it_is_rate_limited(self, api, user, settings):
        """Otherwise this is a free way to mail an address you do not own."""
        for _ in range(5):
            assert api.post(RESEND, {"email": user.email}, format="json").status_code == 200

        assert api.post(RESEND, {"email": user.email}, format="json").status_code == 429

    def test_confirming_does_not_eat_the_resend_budget(self, api, user):
        """Separate buckets, because the storefront posts the link on page load.

        Sharing one scope meant a couple of reloads of the confirmation page
        used up the shopper's allowance for asking to be sent a new link.
        """
        for _ in range(10):
            api.post(VERIFY, {"uid": "!!!", "token": "whatever"}, format="json")

        assert api.post(RESEND, {"email": user.email}, format="json").status_code == 200


class TestMe:
    def test_me_reports_the_confirmation_state(self, signed_in, user):
        assert signed_in.get("/api/auth/me/").data["email_verified"] is False

        user.email_verified_at = timezone.now()
        user.save(update_fields=["email_verified_at"])

        assert signed_in.get("/api/auth/me/").data["email_verified"] is True

    def test_it_cannot_be_set_through_the_profile_endpoint(self, signed_in, user):
        response = signed_in.patch(
            "/api/auth/me/", {"email_verified": True, "first_name": "Ada"}, format="json"
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email_verified_at is None
