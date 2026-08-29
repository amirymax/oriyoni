from django.conf import settings


def test_database_is_postgres():
    """Postgres-specific behaviour is assumed throughout; fail loudly if not."""
    assert settings.DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql"


def test_api_requires_authentication_by_default():
    """Endpoints are private unless they explicitly opt out."""
    assert settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] == [
        "rest_framework.permissions.IsAuthenticated"
    ]
