import logging

from django.contrib.auth.models import update_last_login
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.cookies import clear_auth_cookies, get_refresh_token, set_auth_cookies
from accounts.emails import send_email_verification, send_password_reset_email
from accounts.models import User
from accounts.serializers import (
    EmailVerificationConfirmSerializer,
    EmailVerificationResendSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from accounts.signals import user_signed_in

logger = logging.getLogger(__name__)


def _session_response(user, status_code=status.HTTP_200_OK, mark_login=False, request=None):
    """Serialize the account and attach a freshly issued token pair.

    `mark_login` stamps last_login and announces the sign-in. SimpleJWT's
    UPDATE_LAST_LOGIN only fires from its own obtain-token serializer, which
    these views do not use, so without this the field would stay empty forever
    — and it feeds Django's password reset token, where a stale value weakens
    the link's expiry. Refreshing a token is not a login, so only the sign-in
    paths pass it.

    The signal is what lets the shop fold a guest cart into the account
    without authentication having to know the shop exists.
    """
    if mark_login:
        update_last_login(None, user)
        user_signed_in.send(sender=user.__class__, request=request, user=user)

    refresh = RefreshToken.for_user(user)
    response = Response(UserSerializer(user).data, status=status_code)
    return set_auth_cookies(response, access=str(refresh.access_token), refresh=str(refresh))


def _send_verification(user, language):
    """Mail the confirmation link, best effort.

    The account is already saved and already works, so a mail server having a
    bad day must not turn a completed signup into an error the shopper cannot
    retry — the address would be taken by then. The traceback still reaches
    the log, and /email/verify/resend/ is there for a second attempt.
    """
    try:
        send_email_verification(user, language)
    except Exception:
        logger.exception("Could not send the confirmation email for user %s", user.pk)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    """Hands the storefront a CSRF cookie before it posts anything.

    Cookie-borne credentials need the double-submit token, and a fresh visitor
    has no cookie yet, so the login page calls this first.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


# DRF marks every view csrf_exempt and leaves CSRF to the authentication class,
# which only helps once a request is authenticated. The endpoints below act on
# an anonymous request, so they need the check applied directly. Without it a
# hostile page could sign a visitor into an account it controls and then read
# whatever they went on to put in the cart.
csrf_protected = method_decorator(csrf_protect, name="dispatch")


@csrf_protected
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _send_verification(user, serializer.validated_data["language"])
        # Signing straight in: confirming the address is a nudge rather than a
        # gate, so there is nothing to wait for and bouncing to a login form
        # would be busywork.
        return _session_response(user, status.HTTP_201_CREATED, mark_login=True, request=request)


@csrf_protected
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return _session_response(
            serializer.validated_data["user"], mark_login=True, request=request
        )


@csrf_protected
class RefreshView(APIView):
    """Trades the refresh cookie for a new pair, blacklisting the old one."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_refresh = get_refresh_token(request)
        if not raw_refresh:
            return Response(
                {"detail": "No refresh token.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(raw_refresh)
            user = User.objects.get(pk=refresh["user_id"], is_active=True)
            # Rotation is on, so the presented token is spent here and a
            # replay of it will be refused.
            refresh.blacklist()
        except (TokenError, KeyError, User.DoesNotExist):
            response = Response(
                {"detail": "Invalid or expired refresh token.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            return clear_auth_cookies(response)

        return _session_response(user)


@csrf_protected
class LogoutView(APIView):
    """Revokes the refresh token and clears both cookies."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_refresh = get_refresh_token(request)
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
            except TokenError:
                # Already expired or revoked: the client wanted to be logged
                # out and it is, so this is not worth an error.
                pass

        response = Response({"detail": "Signed out."})
        return clear_auth_cookies(response)


class MeView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])

        # Every outstanding refresh token was issued against the old password,
        # so re-issuing here keeps this browser signed in while the change
        # invalidates any reset link that was in flight.
        return _session_response(user)


@csrf_protected
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = User.objects.normalize_email(serializer.validated_data["email"])
        user = User.objects.filter(email=email, is_active=True).first()
        if user is not None:
            send_password_reset_email(user, serializer.validated_data["language"])

        # Always the same answer. Reporting whether the address was found would
        # turn this endpoint into a way to enumerate customers.
        return Response({"detail": "If that address has an account, a reset link is on its way."})


@csrf_protected
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])

        # Changing the password changes the token generator's input, so the
        # link that got here is now dead and cannot be reused.
        return _session_response(user, mark_login=True, request=request)


@csrf_protected
class EmailVerifyView(APIView):
    """Redeems a confirmation link and signs the browser holding it in.

    Signing in here matches the reset flow, and for the same reason: whoever
    opened the link proved they read the account's inbox. It also means
    clicking through on a phone leaves you signed in on the phone.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "email_verify"

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.email_verified_at = timezone.now()
        user.save(update_fields=["email_verified_at", "updated_at"])

        return _session_response(user, mark_login=True, request=request)


@csrf_protected
class EmailVerificationResendView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "email_verify_resend"

    def post(self, request):
        serializer = EmailVerificationResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = User.objects.normalize_email(serializer.validated_data["email"])
        user = User.objects.filter(
            email=email, is_active=True, email_verified_at__isnull=True
        ).first()
        if user is not None:
            _send_verification(user, serializer.validated_data["language"])

        # The same answer either way, for the reason the reset endpoint gives:
        # otherwise this is a way to ask which addresses shop here, and which
        # of them have already confirmed.
        return Response({"detail": "If that address still needs confirming, a link is on its way."})
