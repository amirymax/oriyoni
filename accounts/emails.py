"""Transactional email.

The storefront ships in English, Russian and Tajik, and the visitor's choice
lives in the browser rather than in the account, so the client passes the
language it is rendering in and the message is written in that language.
"""

from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from accounts.tokens import email_verification_token_generator

_RESET_MESSAGES = {
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
    "tg": {
        "subject": "Барқарорсозии пароли ORIYONI",
        "body": (
            "Касе барои ин ҳисоби ORIYONI барқарорсозии паролро дархост кард.\n\n"
            "Пароли навро дар ин ҷо интихоб кунед:\n{url}\n\n"
            "Пайванд {hours} соат эътибор дорад ва танҳо як маротиба кор мекунад.\n\n"
            "Агар ин шумо набошед, чизе тағйир наёфтааст — танҳо пайвандро накушоед."
            "\n\n— ORIYONI"
        ),
    },
}


_VERIFICATION_MESSAGES = {
    "en": {
        "subject": "Confirm your ORIYONI email",
        "body": (
            "Welcome to ORIYONI.\n\n"
            "Confirm this address so we can reach you about your orders:\n{url}\n\n"
            "The link is good for {hours} hours and can be used once. You can "
            "keep shopping in the meantime — nothing is waiting on it.\n\n"
            "If you did not create an account, you can ignore this message.\n\n"
            "— ORIYONI"
        ),
    },
    "ru": {
        "subject": "Подтвердите адрес почты ORIYONI",
        "body": (
            "Добро пожаловать в ORIYONI.\n\n"
            "Подтвердите этот адрес, чтобы мы могли писать вам о заказах:\n{url}\n\n"
            "Ссылка действует {hours} ч. и работает один раз. Пока можно "
            "спокойно продолжать покупки — она ничего не блокирует.\n\n"
            "Если вы не создавали аккаунт, просто не открывайте ссылку.\n\n"
            "— ORIYONI"
        ),
    },
    "tg": {
        "subject": "Суроғаи почтаи ORIYONI-ро тасдиқ кунед",
        "body": (
            "Ба ORIYONI хуш омадед.\n\n"
            "Ин суроғаро тасдиқ кунед, то мо дар бораи фармоишҳоятон бо шумо "
            "дар тамос шавем:\n{url}\n\n"
            "Пайванд {hours} соат эътибор дорад ва танҳо як маротиба кор мекунад. "
            "То он вақт хариди худро бемалол давом диҳед — ҳеҷ чиз ба он "
            "вобаста нест.\n\n"
            "Агар шумо ҳисоб накушода бошед, танҳо пайвандро накушоед.\n\n"
            "— ORIYONI"
        ),
    },
}


def _link(path, user, token):
    query = urlencode({"uid": urlsafe_base64_encode(force_bytes(user.pk)), "token": token})
    return f"{settings.FRONTEND_URL}{path}?{query}"


def build_password_reset_url(user, token):
    return _link("/reset-password", user, token)


def send_password_reset_email(user, language="en"):
    """Mail a single-use reset link.

    The token is Django's, so it stops working once the password or last_login
    changes — a used link cannot be replayed.
    """
    token = default_token_generator.make_token(user)
    url = build_password_reset_url(user, token)
    template = _RESET_MESSAGES.get(language, _RESET_MESSAGES["en"])

    send_mail(
        subject=template["subject"],
        message=template["body"].format(url=url, hours=settings.PASSWORD_RESET_TIMEOUT // 3600),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return url


def build_email_verification_url(user, token):
    return _link("/verify-email", user, token)


def send_email_verification(user, language="en"):
    """Mail a single-use link confirming the address belongs to the shopper.

    Nothing on the storefront waits for this: the account already works, and
    confirming only clears the nudge and tells the shop the address is real.
    """
    token = email_verification_token_generator.make_token(user)
    url = build_email_verification_url(user, token)
    template = _VERIFICATION_MESSAGES.get(language, _VERIFICATION_MESSAGES["en"])

    send_mail(
        subject=template["subject"],
        message=template["body"].format(url=url, hours=settings.EMAIL_VERIFICATION_TIMEOUT // 3600),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return url
