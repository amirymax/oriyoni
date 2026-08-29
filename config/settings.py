"""Django settings for the ORIYONI backend.

Every environment-specific value is read from the environment, with defaults
that are safe for local development only. See .env.example for the full list.
"""

from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()

# Read .env if present. Deployments may set real environment variables instead.
env_file = BASE_DIR / ".env"
if env_file.exists():
    env.read_env(env_file)

# ------------------------------------------------------------------ core --

# The default is a development-only placeholder; production must set its own.
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="django-insecure-dev-only-do-not-use-in-production",
)

DEBUG = env.bool("DJANGO_DEBUG", default=False)

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------ apps --

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Registers the lookups the catalogue's ArrayField columns rely on.
    "django.contrib.postgres",
    "rest_framework",
    # Stores rotated-out refresh tokens so logout can actually revoke them.
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "core",
    "accounts",
    "catalog",
    "cart",
    "orders",
    "wishlist",
    "engagement",
]

AUTH_USER_MODEL = "accounts.User"

# Matches the lookup to how addresses are stored, making login
# case-insensitive. See accounts.backends.EmailBackend.
AUTHENTICATION_BACKENDS = ["accounts.backends.EmailBackend"]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # Serves the admin's static files straight from gunicorn, so a deploy
    # does not also need nginx to be taught where they live.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # Must precede CommonMiddleware so that preflights get their headers even
    # when CommonMiddleware would redirect the request.
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# -------------------------------------------------------------- database --

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://oriyoni:oriyoni@localhost:5432/oriyoni",
    ),
}

# ------------------------------------------------------------ validation --

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------- i18n/tz --

# The storefront is bilingual, but the API serves both languages in one
# payload rather than negotiating a locale, so Django itself stays on English.
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------- static --

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # Hashed filenames and compression, so static files can be cached hard.
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# --------------------------------------------------------- REST framework --

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    # Locked down by default; public endpoints opt out explicitly.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.CookieJWTAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    # Large enough that today's catalogue arrives in one call, bounded so a
    # grown one cannot be asked for all at once.
    "PAGE_SIZE": 48,
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        # Guessing a password and mining the reset endpoint are the two attacks
        # these endpoints invite, so both are rate limited by IP.
        "login": env("THROTTLE_LOGIN", default="10/min"),
        "register": env("THROTTLE_REGISTER", default="10/hour"),
        "password_reset": env("THROTTLE_PASSWORD_RESET", default="5/hour"),
        "checkout": env("THROTTLE_CHECKOUT", default="20/hour"),
        # Newsletter and contact are unauthenticated write endpoints,
        # which is exactly what a spam script looks for.
        "engagement": env("THROTTLE_ENGAGEMENT", default="10/hour"),
    },
    "EXCEPTION_HANDLER": "core.exceptions.exception_handler",
}

if DEBUG:
    # The browsable API is a convenience while developing; never in production.
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ]

# ---------------------------------------------------------------- tokens --

# Access tokens are short-lived because nothing revokes them individually;
# refresh tokens rotate and the old one is blacklisted, so a stolen refresh
# token stops working as soon as the real client next refreshes.
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_MINUTES", default=15)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_DAYS", default=14)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    # Not UPDATE_LAST_LOGIN: it only applies to SimpleJWT's own obtain-token
    # serializer, which these views replace. accounts.views stamps it instead.
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# Tokens travel in httpOnly cookies so page JavaScript — and anything injected
# into it — cannot read them. The browser attaches them automatically, which
# is why CSRF protection below is not optional.
AUTH_COOKIE_ACCESS = "oriyoni_access"
AUTH_COOKIE_REFRESH = "oriyoni_refresh"
# Off locally, where the storefront talks to http://localhost.
AUTH_COOKIE_SECURE = env.bool("AUTH_COOKIE_SECURE", default=not DEBUG)
# "None" is required when the storefront and API sit on different sites, and
# browsers only honour it together with Secure.
AUTH_COOKIE_SAMESITE = env("AUTH_COOKIE_SAMESITE", default="Lax")
AUTH_COOKIE_DOMAIN = env("AUTH_COOKIE_DOMAIN", default=None)

# ------------------------------------------------------------------ CORS --

# The storefront runs on its own origin and must send cookies with each call.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000"])
CSRF_COOKIE_SAMESITE = AUTH_COOKIE_SAMESITE
CSRF_COOKIE_SECURE = AUTH_COOKIE_SECURE
# Readable by JavaScript on purpose: the storefront echoes it back in the
# X-CSRFToken header, which is what proves the request came from the page.
CSRF_COOKIE_HTTPONLY = False

# ----------------------------------------------------------------- email --

# Console in development prints the reset link straight into the runserver log.
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="ORIYONI <no-reply@oriyoni.com>")
# Where the contact form lands.
CONTACT_EMAIL = env("CONTACT_EMAIL", default="hello@oriyoni.com")

# Where password reset links point; the storefront owns that page, not Django.
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000").rstrip("/")
PASSWORD_RESET_TIMEOUT = env.int("PASSWORD_RESET_TIMEOUT", default=60 * 60 * 3)

# -------------------------------------------------------------- security --

# All of these only bite once DEBUG is off, so local development over plain
# http is unaffected while production gets the strict settings by default.
if not DEBUG:
    # Behind nginx or a load balancer, Django only learns the original scheme
    # from this header — without it every request looks like plain http and
    # the redirect below would loop.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)

    # Start low and raise it once you are sure every subdomain is on HTTPS:
    # browsers remember HSTS, so a careless value is hard to walk back.
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=3600)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False)
    SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=False)

    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

# --------------------------------------------------------------- logging --

# Without this Django logs nothing above WARNING once DEBUG is off, so a 500
# in production would leave no trace.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {name} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}
