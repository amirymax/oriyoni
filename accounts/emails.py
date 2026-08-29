"""Transactional email.

The storefront ships in English and Russian, and the visitor's choice lives in
the browser rather than in the account, so the client passes the language it is
rendering in and the message is written in that language.
"""

from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

_MESSAGES = {
    "en": {
        "subject": "Reset your ORIYONI password",
        "body": (
            "Someone asked to reset the password for this ORIYONI account.\n\n"
            "Choose a new one here:\n{url}\n\n"
            "The link is good for {hours} hours and can be used once.\n\n"
            "If this was not you, nothing has changed and you can ignore this "
            "message.\n\n— ORIYONI"
        ),
    },
    "ru": {
        "subject": "Сброс пароля ORIYONI",
        "body": (
            "Кто-то запросил сброс пароля для этого аккаунта ORIYONI.\n\n"
            "Задайте новый пароль здесь:\n{url}\n\n"
            "Ссылка действует {hours} ч. и работает один раз.\n\n"
            "Если это были не вы, ничего не изменилось — просто не открывайте "
            "ссылку.\n\n— ORIYONI"
        ),
    },
}


def build_password_reset_url(user, token):
    query = urlencode({"uid": urlsafe_base64_encode(force_bytes(user.pk)), "token": token})
    return f"{settings.FRONTEND_URL}/reset-password?{query}"


def send_password_reset_email(user, language="en"):
    """Mail a single-use reset link.

    The token is Django's, so it stops working once the password or last_login
    changes — a used link cannot be replayed.
    """
    token = default_token_generator.make_token(user)
    url = build_password_reset_url(user, token)
    template = _MESSAGES.get(language, _MESSAGES["en"])

    send_mail(
        subject=template["subject"],
        message=template["body"].format(url=url, hours=settings.PASSWORD_RESET_TIMEOUT // 3600),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return url
