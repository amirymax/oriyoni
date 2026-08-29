import pytest
from django.core.cache import cache


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
