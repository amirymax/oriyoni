from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication


class _CSRFCheck(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason


class CookieJWTAuthentication(JWTAuthentication):
    """Reads the access token from an httpOnly cookie, then enforces CSRF.

    A token in an Authorization header is proof the caller ran JavaScript that
    could read it. A token in a cookie is not: the browser attaches it to any
    request any site can provoke, which is exactly the cross-site request
    forgery shape. So whenever the credential came from the cookie we require
    the double-submit CSRF token as well, the same trade DRF's
    SessionAuthentication makes.

    An Authorization header still works and skips the CSRF check, which keeps
    curl and the test client usable without a cookie jar.
    """

    def authenticate(self, request):
        header = self.get_header(request)

        if header is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
            # Empty as well as missing: signing out deletes the cookie by
            # setting it to "", and a client that echoes that back must be
            # treated as anonymous rather than as holding a broken token —
            # otherwise the whole site answers 401 to a signed-out visitor.
            if not raw_token:
                return None
            from_cookie = True
        else:
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None
            from_cookie = False

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        if from_cookie:
            self.enforce_csrf(request)

        return user, validated_token

    def enforce_csrf(self, request):
        check = _CSRFCheck(lambda req: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f"CSRF failed: {reason}")
