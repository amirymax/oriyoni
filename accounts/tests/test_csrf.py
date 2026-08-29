"""CSRF behaviour.

Cookies ride along on requests any site can provoke, so putting the JWT in one
buys XSS safety at the cost of needing CSRF protection. These tests use a
client with enforce_csrf_checks on, since the default test client disables the
check and would let a regression through unnoticed.
"""

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.tests.conftest import PASSWORD

pytestmark = pytest.mark.django_db

CSRF = "/api/auth/csrf/"
LOGIN = "/api/auth/login/"
ME = "/api/auth/me/"


@pytest.fixture
def strict():
    return APIClient(enforce_csrf_checks=True)


def csrf_token(client):
    response = client.get(CSRF)
    assert response.status_code == 200
    return client.cookies["csrftoken"].value


def test_csrf_endpoint_issues_a_cookie(strict):
    strict.get(CSRF)

    assert strict.cookies["csrftoken"].value


def test_csrf_cookie_is_readable_by_the_storefront(strict):
    """The page has to echo it back in a header, so it cannot be httpOnly."""
    strict.get(CSRF)

    assert not strict.cookies["csrftoken"]["httponly"]


class TestAnonymousEndpoints:
    def test_login_without_a_token_is_refused(self, strict, user):
        response = strict.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")

        assert response.status_code == 403

    def test_login_with_a_token_succeeds(self, strict, user):
        token = csrf_token(strict)

        response = strict.post(
            LOGIN,
            {"email": user.email, "password": PASSWORD},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )

        assert response.status_code == 200


class TestAuthenticatedEndpoints:
    @pytest.fixture
    def strict_signed_in(self, strict, user):
        token = csrf_token(strict)
        response = strict.post(
            LOGIN,
            {"email": user.email, "password": PASSWORD},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        assert response.status_code == 200
        return strict

    def test_reads_do_not_need_a_token(self, strict_signed_in):
        assert strict_signed_in.get(ME).status_code == 200

    def test_write_without_a_token_is_refused(self, strict_signed_in):
        response = strict_signed_in.patch(ME, {"first_name": "Ada"}, format="json")

        assert response.status_code == 403
        assert "CSRF" in response.data["detail"]

    def test_write_with_a_token_succeeds(self, strict_signed_in):
        token = strict_signed_in.cookies["csrftoken"].value

        response = strict_signed_in.patch(
            ME, {"first_name": "Ada"}, format="json", HTTP_X_CSRFTOKEN=token
        )

        assert response.status_code == 200


def test_bearer_header_skips_the_check(strict, user):
    """A header token had to be read by script, so it is not forgeable this way.

    This is the path curl and server-to-server callers use.
    """
    access = RefreshToken.for_user(user).access_token

    response = strict.patch(
        ME,
        {"first_name": "Ada"},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {access}",
    )

    assert response.status_code == 200
