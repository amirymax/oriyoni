import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _no_https_redirect(settings):
    """Let the test client speak plain http.

    DEBUG is off under pytest, which is deliberate — the suite should exercise
    production-like settings — but that also switches on SECURE_SSL_REDIRECT,
    and the test client requests http, so every response becomes a 301 to
    https://testserver. The real value is asserted directly in
    core/tests/test_production_settings.py instead.
    """
    settings.SECURE_SSL_REDIRECT = False


@pytest.fixture(autouse=True)
def _plain_static_storage(settings):
    """Render {% static %} without a collectstatic manifest.

    WhiteNoise's manifest storage refuses to resolve a file it has not seen in
    staticfiles.json, which is built by collectstatic at deploy time and does
    not exist here — so every admin page would fail on its own stylesheet.
    """
    settings.STORAGES = {
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }


@pytest.fixture(autouse=True)
def _empty_catalogue(request):
    """Start from an empty catalogue rather than the seeded one.

    The seed data migration runs when the test database is built, so every
    test would otherwise open with eleven products in it — colliding with
    fixtures that create their own and making any assertion about counts an
    assertion about the seed. Tests that are specifically about the seed carry
    @pytest.mark.seeded.
    """
    if "seeded" in request.keywords:
        return
    # Tests that never touch the database must not be given one.
    if not {"db", "transactional_db", "django_db_setup"} & set(request.fixturenames):
        return

    from cart.models import Cart
    from catalog.models import Category, Color, Product, ProductVariant

    Cart.objects.all().delete()
    ProductVariant.objects.all().delete()
    Product.objects.all().delete()
    Color.objects.all().delete()
    Category.objects.all().delete()


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Isolate rate limiting between tests.

    DRF counts requests per client in the default cache, which outlives a
    single test. Without this, a test that logs in a few times starts handing
    429s to whatever runs after it.
    """
    cache.clear()
    yield
    cache.clear()
