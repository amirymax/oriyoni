import re

import pytest
from django.contrib.auth import get_user_model
from django.core import mail

from accounts.tests.conftest import PASSWORD

User = get_user_model()

pytestmark = pytest.mark.django_db

REQUEST = "/api/auth/password/reset/"
CONFIRM = "/api/auth/password/reset/confirm/"
LOGIN = "/api/auth/login/"

NEW_PASSWORD = "an-entirely-different-secret"


def reset_credentials(email="ada@example.com", language="en", api=None):
    """Ask for a reset and pull uid/token back out of the sent email."""
    api.post(REQUEST, {"email": email, "language": language}, format="json")
    body = mail.outbox[-1].body
    match = re.search(r"uid=([^&\s]+)&token=([^\s]+)", body)
    assert match, body
    return {"uid": match.group(1), "token": match.group(2)}


class TestRequest:
    def test_sends_a_link_to_a_known_address(self, api, user):
        response = api.post(REQUEST, {"email": user.email}, format="json")

        assert response.status_code == 200
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == [user.email]

    def test_unknown_address_gets_the_same_answer_and_no_email(self, api):
        """Otherwise this endpoint tells an attacker who shops here."""
        known = api.post(REQUEST, {"email": "nobody@example.com"}, format="json")

        assert known.status_code == 200
        assert mail.outbox == []

    def test_known_and_unknown_answers_are_identical(self, api, user):
        unknown = api.post(REQUEST, {"email": "nobody@example.com"}, format="json")
        found = api.post(REQUEST, {"email": user.email}, format="json")

        assert unknown.data == found.data

    def test_address_is_matched_case_insensitively(self, api, user):
        api.post(REQUEST, {"email": "ADA@Example.com"}, format="json")

        assert len(mail.outbox) == 1

    def test_deactivated_account_gets_no_email(self, api, user):
        user.is_active = False
        user.save(update_fields=["is_active"])

        response = api.post(REQUEST, {"email": user.email}, format="json")

        assert response.status_code == 200
        assert mail.outbox == []

    def test_email_is_written_in_the_requested_language(self, api, user):
        api.post(REQUEST, {"email": user.email, "language": "ru"}, format="json")

        assert "ORIYONI" in mail.outbox[0].subject
        assert "пароля" in mail.outbox[0].subject

    def test_language_defaults_to_english(self, api, user):
        api.post(REQUEST, {"email": user.email}, format="json")

        assert mail.outbox[0].subject == "Reset your ORIYONI password"

    def test_link_points_at_the_storefront(self, api, user, settings):
        api.post(REQUEST, {"email": user.email}, format="json")

        assert settings.FRONTEND_URL in mail.outbox[0].body
        assert "/reset-password?" in mail.outbox[0].body


class TestConfirm:
    def test_sets_the_new_password_and_signs_in(self, api, user):
        credentials = reset_credentials(api=api)

        response = api.post(CONFIRM, {**credentials, "new_password": NEW_PASSWORD}, format="json")

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.check_password(NEW_PASSWORD)

    def test_the_old_password_stops_working(self, api, user):
        credentials = reset_credentials(api=api)
        api.post(CONFIRM, {**credentials, "new_password": NEW_PASSWORD}, format="json")

        api.cookies.clear()
        response = api.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")

        assert response.status_code == 400

    def test_a_link_cannot_be_used_twice(self, api, user):
        credentials = reset_credentials(api=api)
        api.post(CONFIRM, {**credentials, "new_password": NEW_PASSWORD}, format="json")

        second = api.post(
            CONFIRM, {**credentials, "new_password": "yet-another-secret"}, format="json"
        )

        assert second.status_code == 400
        assert "token" in second.data["errors"]

    def test_a_tampered_token_is_rejected(self, api, user):
        credentials = reset_credentials(api=api)
        credentials["token"] = credentials["token"][:-1] + "x"

        response = api.post(CONFIRM, {**credentials, "new_password": NEW_PASSWORD}, format="json")

        assert response.status_code == 400
        user.refresh_from_db()
        assert user.check_password(PASSWORD)

    def test_a_token_for_another_account_is_rejected(self, api, user):
        other = User.objects.create_user("grace@example.com", PASSWORD)
        credentials = reset_credentials(api=api)
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        credentials["uid"] = urlsafe_base64_encode(force_bytes(other.pk))

        response = api.post(CONFIRM, {**credentials, "new_password": NEW_PASSWORD}, format="json")

        assert response.status_code == 400
        other.refresh_from_db()
        assert other.check_password(PASSWORD)

    def test_a_nonsense_uid_is_rejected(self, api):
        response = api.post(
            CONFIRM,
            {"uid": "!!!", "token": "whatever", "new_password": NEW_PASSWORD},
            format="json",
        )

        assert response.status_code == 400

    def test_a_weak_new_password_is_rejected(self, api, user):
        credentials = reset_credentials(api=api)

        response = api.post(CONFIRM, {**credentials, "new_password": "abc"}, format="json")

        assert response.status_code == 400
        assert "new_password" in response.data["errors"]
        user.refresh_from_db()
        assert user.check_password(PASSWORD)

    def test_signing_in_invalidates_an_outstanding_link(self, api, user):
        """Django's token folds in last_login, so a later login spends it."""
        credentials = reset_credentials(api=api)
        api.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")

        response = api.post(CONFIRM, {**credentials, "new_password": NEW_PASSWORD}, format="json")

        assert response.status_code == 400
