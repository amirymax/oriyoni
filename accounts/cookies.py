"""Reading and writing the httpOnly cookies that carry the JWTs."""

from django.conf import settings

# The refresh cookie is scoped to the auth endpoints that consume it — refresh
# and logout — so the browser does not attach a long-lived credential to every
# other API call.
REFRESH_COOKIE_PATH = "/api/auth/"


def _common_kwargs():
    return {
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
        "domain": settings.AUTH_COOKIE_DOMAIN,
    }


def set_auth_cookies(response, access, refresh=None):
    """Attach the access token, and the refresh token when one was issued.

    Cookie lifetimes mirror the token lifetimes, so an expired cookie is never
    sent in the first place.
    """
    response.set_cookie(
        settings.AUTH_COOKIE_ACCESS,
        access,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        path="/",
        **_common_kwargs(),
    )

    if refresh is not None:
        response.set_cookie(
            settings.AUTH_COOKIE_REFRESH,
            refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            path=REFRESH_COOKIE_PATH,
            **_common_kwargs(),
        )

    return response


def clear_auth_cookies(response):
    response.delete_cookie(
        settings.AUTH_COOKIE_ACCESS,
        path="/",
        domain=settings.AUTH_COOKIE_DOMAIN,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH,
        path=REFRESH_COOKIE_PATH,
        domain=settings.AUTH_COOKIE_DOMAIN,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    return response


def get_refresh_token(request):
    return request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
