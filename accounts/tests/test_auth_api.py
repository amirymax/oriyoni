import pytest
from django.conf import settings
from django.contrib.auth import get_user_model

from accounts.tests.conftest import PASSWORD, access_cookie, refresh_cookie

User = get_user_model()

pytestmark = pytest.mark.django_db

REGISTER = "/api/auth/register/"
LOGIN = "/api/auth/login/"
REFRESH = "/api/auth/refresh/"
LOGOUT = "/api/auth/logout/"
ME = "/api/auth/me/"
PASSWORD_CHANGE = "/api/auth/password/change/"


class TestRegister:
    def test_creates_an_account_and_signs_it_in(self, api):
        response = api.post(
            REGISTER,
            {"email": "new@example.com", "password": PASSWORD, "first_name": "Ada"},
            format="json",
        )

        assert response.status_code == 201
        assert response.data["email"] == "new@example.com"
        assert response.data["first_name"] == "Ada"
        assert access_cookie(response)
        assert refresh_cookie(response)

    def test_stores_the_user_with_a_hashed_password(self, api):
        api.post(REGISTER, {"email": "new@example.com", "password": PASSWORD}, format="json")

        user = User.objects.get(email="new@example.com")
        assert user.check_password(PASSWORD)
        assert user.last_login is not None

    def test_does_not_return_the_password(self, api):
        response = api.post(
            REGISTER, {"email": "new@example.com", "password": PASSWORD}, format="json"
        )

        assert "password" not in response.data

    def test_tokens_are_not_readable_by_javascript(self, api):
        response = api.post(
            REGISTER, {"email": "new@example.com", "password": PASSWORD}, format="json"
        )

        assert access_cookie(response)["httponly"]
        assert refresh_cookie(response)["httponly"]

    def test_refresh_cookie_is_scoped_to_the_auth_endpoints(self, api):
        response = api.post(
            REGISTER, {"email": "new@example.com", "password": PASSWORD}, format="json"
        )

        assert refresh_cookie(response)["path"] == "/api/auth/"
        assert access_cookie(response)["path"] == "/"

    def test_email_is_normalized(self, api):
        response = api.post(
            REGISTER, {"email": "  New@Example.COM  ", "password": PASSWORD}, format="json"
        )

        assert response.status_code == 201
        assert response.data["email"] == "new@example.com"

    def test_duplicate_email_is_rejected(self, api, user):
        response = api.post(REGISTER, {"email": user.email, "password": PASSWORD}, format="json")

        assert response.status_code == 400
        assert "email" in response.data["errors"]

    def test_duplicate_differing_only_in_case_is_rejected(self, api, user):
        response = api.post(
            REGISTER, {"email": "ADA@EXAMPLE.COM", "password": PASSWORD}, format="json"
        )

        assert response.status_code == 400
        assert "email" in response.data["errors"]

    def test_short_password_is_rejected(self, api):
        response = api.post(
            REGISTER, {"email": "new@example.com", "password": "ab1"}, format="json"
        )

        assert response.status_code == 400
        assert "password" in response.data["errors"]
        assert not User.objects.filter(email="new@example.com").exists()

    def test_common_password_is_rejected(self, api):
        response = api.post(
            REGISTER, {"email": "new@example.com", "password": "password123"}, format="json"
        )

        assert response.status_code == 400
        assert "password" in response.data["errors"]

    def test_password_resembling_the_email_is_rejected(self, api):
        """The similarity validator needs the account, so it runs in validate()."""
        response = api.post(
            REGISTER,
            {"email": "ada.lovelace@example.com", "password": "ada.lovelace"},
            format="json",
        )

        assert response.status_code == 400
        assert "password" in response.data["errors"]

    def test_malformed_email_is_rejected(self, api):
        response = api.post(REGISTER, {"email": "nope", "password": PASSWORD}, format="json")

        assert response.status_code == 400
        assert "email" in response.data["errors"]


class TestLogin:
    def test_signs_in_and_sets_cookies(self, api, user):
        response = api.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")

        assert response.status_code == 200
        assert response.data["email"] == user.email
        assert access_cookie(response)
        assert refresh_cookie(response)

    def test_is_case_insensitive(self, api, user):
        response = api.post(
            LOGIN, {"email": "ADA@Example.com", "password": PASSWORD}, format="json"
        )

        assert response.status_code == 200

    def test_records_last_login(self, api, user):
        assert user.last_login is None

        api.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")

        user.refresh_from_db()
        assert user.last_login is not None

    @pytest.mark.parametrize(
        ("email", "password"),
        [
            ("ada@example.com", "wrong-password"),
            ("nobody@example.com", PASSWORD),
        ],
    )
    def test_bad_credentials_are_indistinguishable(self, api, user, email, password):
        """A different message for an unknown address would leak who has an account."""
        response = api.post(LOGIN, {"email": email, "password": password}, format="json")

        assert response.status_code == 400
        assert response.data["errors"]["non_field_errors"] == ["Incorrect email or password."]

    def test_deactivated_account_cannot_sign_in(self, api, user):
        user.is_active = False
        user.save(update_fields=["is_active"])

        response = api.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")

        assert response.status_code == 400
        assert response.data["errors"]["non_field_errors"] == ["Incorrect email or password."]

    def test_failure_sets_no_cookies(self, api, user):
        response = api.post(LOGIN, {"email": user.email, "password": "wrong"}, format="json")

        assert access_cookie(response) is None
        assert refresh_cookie(response) is None


class TestMe:
    def test_requires_authentication(self, api):
        assert api.get(ME).status_code == 401

    def test_returns_the_signed_in_account(self, signed_in, user):
        response = signed_in.get(ME)

        assert response.status_code == 200
        assert response.data["email"] == user.email

    def test_updates_the_name(self, signed_in, user):
        response = signed_in.patch(
            ME, {"first_name": "Ada", "last_name": "Lovelace"}, format="json"
        )

        assert response.status_code == 200
        assert response.data["full_name"] == "Ada Lovelace"
        user.refresh_from_db()
        assert user.first_name == "Ada"

    def test_email_cannot_be_changed_here(self, signed_in, user):
        """Swapping the login credential without confirmation is a takeover."""
        response = signed_in.patch(ME, {"email": "attacker@example.com"}, format="json")

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.email == "ada@example.com"


class TestRefresh:
    def test_issues_a_new_pair(self, signed_in):
        before = signed_in.cookies[settings.AUTH_COOKIE_REFRESH].value

        response = signed_in.post(REFRESH)

        assert response.status_code == 200
        assert refresh_cookie(response).value != before
        assert access_cookie(response)

    def test_without_a_cookie_is_unauthorized(self, api):
        response = api.post(REFRESH)

        assert response.status_code == 401

    def test_a_spent_refresh_token_cannot_be_replayed(self, signed_in):
        """Rotation blacklists the old token; presenting it again must fail."""
        spent = signed_in.cookies[settings.AUTH_COOKIE_REFRESH].value
        signed_in.post(REFRESH)

        signed_in.cookies[settings.AUTH_COOKIE_REFRESH] = spent
        response = signed_in.post(REFRESH)

        assert response.status_code == 401

    def test_garbage_token_is_rejected_and_cookies_cleared(self, api):
        api.cookies[settings.AUTH_COOKIE_REFRESH] = "not-a-token"

        response = api.post(REFRESH)

        assert response.status_code == 401
        assert refresh_cookie(response).value == ""

    def test_deactivated_account_cannot_refresh(self, signed_in, user):
        user.is_active = False
        user.save(update_fields=["is_active"])

        assert signed_in.post(REFRESH).status_code == 401


class TestLogout:
    def test_clears_both_cookies(self, signed_in):
        response = signed_in.post(LOGOUT)

        assert response.status_code == 200
        assert access_cookie(response).value == ""
        assert refresh_cookie(response).value == ""

    def test_revokes_the_refresh_token(self, signed_in):
        spent = signed_in.cookies[settings.AUTH_COOKIE_REFRESH].value
        signed_in.post(LOGOUT)

        signed_in.cookies[settings.AUTH_COOKIE_REFRESH] = spent
        assert signed_in.post(REFRESH).status_code == 401

    def test_without_a_session_still_succeeds(self, api):
        """The caller wanted to be signed out and they are."""
        assert api.post(LOGOUT).status_code == 200


class TestPasswordChange:
    def test_changes_the_password(self, signed_in, user):
        response = signed_in.post(
            PASSWORD_CHANGE,
            {"current_password": PASSWORD, "new_password": "a-brand-new-secret"},
            format="json",
        )

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.check_password("a-brand-new-secret")

    def test_wrong_current_password_is_rejected(self, signed_in, user):
        response = signed_in.post(
            PASSWORD_CHANGE,
            {"current_password": "wrong", "new_password": "a-brand-new-secret"},
            format="json",
        )

        assert response.status_code == 400
        assert "current_password" in response.data["errors"]
        user.refresh_from_db()
        assert user.check_password(PASSWORD)

    def test_weak_new_password_is_rejected(self, signed_in):
        response = signed_in.post(
            PASSWORD_CHANGE,
            {"current_password": PASSWORD, "new_password": "abc"},
            format="json",
        )

        assert response.status_code == 400
        assert "new_password" in response.data["errors"]

    def test_requires_authentication(self, api):
        response = api.post(
            PASSWORD_CHANGE,
            {"current_password": PASSWORD, "new_password": "a-brand-new-secret"},
            format="json",
        )

        assert response.status_code == 401


class TestErrorShape:
    def test_validation_errors_carry_a_detail_and_a_field_map(self, api):
        response = api.post(REGISTER, {"email": "nope"}, format="json")

        assert set(response.data) == {"detail", "errors"}
        assert isinstance(response.data["detail"], str)
        assert isinstance(response.data["errors"], dict)
        assert response.data["errors"]["password"]

    def test_plain_errors_carry_an_empty_field_map(self, api):
        response = api.get(ME)

        assert set(response.data) == {"detail", "errors"}
        assert response.data["errors"] == {}
