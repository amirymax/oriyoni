import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

PASSWORD = "correct-horse-battery"


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user("ada@example.com", PASSWORD)


@pytest.fixture
def signed_in(api, user):
    """A client holding valid auth cookies, plus the CSRF token to use them."""
    response = api.post(
        "/api/auth/login/",
        {"email": user.email, "password": PASSWORD},
        format="json",
    )
    assert response.status_code == 200
    return api


def access_cookie(response):
    return response.cookies.get(settings.AUTH_COOKIE_ACCESS)


def refresh_cookie(response):
    return response.cookies.get(settings.AUTH_COOKIE_REFRESH)
