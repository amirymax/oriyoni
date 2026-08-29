"""Rate limits on the endpoints that invite guessing.

Login guards against password guessing, and the reset endpoint against being
mined for which addresses have accounts.

Two things about DRF make these tests fiddly enough to be worth spelling out:

* `SimpleRateThrottle.THROTTLE_RATES` is read from the settings once, when the
  module is imported, so overriding REST_FRAMEWORK at runtime does nothing.
  The rate has to be patched on that dict itself.
* The counter is keyed by user id once a request authenticates, and only by IP
  before that. A client that has just signed in therefore moves to its own
  bucket, so anything testing the anonymous limit has to stay anonymous.
"""

import pytest
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from accounts.tests.conftest import PASSWORD

pytestmark = pytest.mark.django_db

LOGIN = "/api/auth/login/"
REGISTER = "/api/auth/register/"
RESET = "/api/auth/password/reset/"


@pytest.fixture
def rate(monkeypatch):
    """Set one scope's rate for the duration of a test."""

    def _set(scope, value):
        monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, scope, value)

    return _set


def test_repeated_login_attempts_are_throttled(api, user, rate):
    rate("login", "3/min")

    codes = [
        api.post(LOGIN, {"email": user.email, "password": "wrong"}, format="json").status_code
        for _ in range(4)
    ]

    assert codes == [400, 400, 400, 429]


def test_successful_logins_count_too(user, rate):
    """Otherwise knowing one password would reset the counter at will.

    A fresh client per attempt keeps every request anonymous, which is the
    shape of the attack — one address, many sessions.
    """
    rate("login", "2/min")

    codes = [
        APIClient()
        .post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")
        .status_code
        for _ in range(3)
    ]

    assert codes == [200, 200, 429]


def test_the_limit_is_shared_across_accounts(user, django_user_model, rate):
    """Rotating the target address must not buy an attacker more attempts."""
    django_user_model.objects.create_user("grace@example.com", PASSWORD)
    rate("login", "2/min")

    client = APIClient()
    client.post(LOGIN, {"email": user.email, "password": "wrong"}, format="json")
    client.post(LOGIN, {"email": "grace@example.com", "password": "wrong"}, format="json")

    response = client.post(LOGIN, {"email": user.email, "password": "wrong"}, format="json")

    assert response.status_code == 429


def test_repeated_reset_requests_are_throttled(api, user, rate):
    rate("password_reset", "2/hour")

    codes = [api.post(RESET, {"email": user.email}, format="json").status_code for _ in range(3)]

    assert codes == [200, 200, 429]


def test_repeated_registrations_are_throttled(rate):
    rate("register", "2/hour")

    codes = [
        APIClient()
        .post(REGISTER, {"email": f"new{i}@example.com", "password": PASSWORD}, format="json")
        .status_code
        for i in range(3)
    ]

    assert codes == [201, 201, 429]


def test_reads_are_not_throttled(signed_in):
    """Only the scoped endpoints are limited; browsing must stay unmetered."""
    for _ in range(30):
        assert signed_in.get("/api/auth/me/").status_code == 200
