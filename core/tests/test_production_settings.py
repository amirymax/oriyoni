"""The settings that only take effect once DEBUG is off.

Those branches never run under the test suite, which is exactly how a
production hardening block gets deleted without anything going red. This loads
settings.py a second time, under its own module name and with DEBUG unset, so
the real configured settings are untouched.
"""

import importlib.util
from pathlib import Path

import pytest

SETTINGS_FILE = Path(__file__).resolve().parents[2] / "config" / "settings.py"


def load_settings(monkeypatch, **env):
    for key, value in env.items():
        monkeypatch.setenv(key, value)

    spec = importlib.util.spec_from_file_location("_settings_probe", SETTINGS_FILE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def production(monkeypatch):
    return load_settings(
        monkeypatch,
        DJANGO_DEBUG="False",
        DJANGO_SECRET_KEY="a-real-secret-key-for-this-test-only-not-used-anywhere",
    )


@pytest.fixture
def development(monkeypatch):
    return load_settings(monkeypatch, DJANGO_DEBUG="True")


class TestProduction:
    def test_https_is_required(self, production):
        assert production.SECURE_SSL_REDIRECT is True

    def test_the_proxy_header_is_trusted_for_the_scheme(self, production):
        """Behind a load balancer every request looks like http without this,
        and the redirect above would loop forever."""
        assert production.SECURE_PROXY_SSL_HEADER == ("HTTP_X_FORWARDED_PROTO", "https")

    def test_hsts_is_on(self, production):
        assert production.SECURE_HSTS_SECONDS > 0

    def test_cookies_are_secure(self, production):
        assert production.SESSION_COOKIE_SECURE is True
        assert production.CSRF_COOKIE_SECURE is True
        assert production.AUTH_COOKIE_SECURE is True

    def test_the_csrf_cookie_stays_readable(self, production):
        """The storefront has to echo it back in a header, so httpOnly would
        break every write even in production."""
        assert production.CSRF_COOKIE_HTTPONLY is False

    def test_the_browsable_api_is_off(self, production):
        assert production.REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] == [
            "rest_framework.renderers.JSONRenderer"
        ]

    def test_errors_are_logged(self, production):
        """Django logs nothing above WARNING once DEBUG is off unless told to."""
        assert production.LOGGING["root"]["handlers"] == ["console"]

    def test_static_files_are_hashed_and_compressed(self, production):
        assert "Compressed" in production.STORAGES["staticfiles"]["BACKEND"]


class TestDevelopment:
    def test_https_is_not_forced_locally(self, development):
        """Otherwise http://localhost:8000 redirects into a dead end."""
        assert not hasattr(development, "SECURE_SSL_REDIRECT")

    def test_cookies_are_not_secure_only(self, development):
        assert development.AUTH_COOKIE_SECURE is False

    def test_the_browsable_api_is_available(self, development):
        assert (
            "rest_framework.renderers.BrowsableAPIRenderer"
            in development.REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"]
        )
