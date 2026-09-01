"""Telegram notifications for the shop owner.

stdlib urllib rather than requests: one JSON POST does not justify another
package on the server, and the deploy installs from requirements/prod.txt
where every dependency is one more thing to keep current.

Every call here is best effort. Telegram being unreachable must never turn a
customer's completed order into an error — the order is already committed by
the time any of this runs.
"""

import html
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

_ENDPOINT = "https://api.telegram.org/bot{token}/{method}"


def is_configured():
    """Whether a token and chat have been set, so callers can skip silently."""
    return bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID)


def escape(value):
    """Escape text for parse_mode=HTML."""
    return html.escape(str(value), quote=False)


def send_message(text):
    """Post one message to the shop's chat. Returns whether it went.

    Never raises. A timeout is set explicitly because urlopen's default is to
    wait indefinitely, and this is called from inside a request — an
    unreachable Telegram would otherwise hold a worker the way an unreachable
    mail server does.
    """
    if not is_configured():
        return False

    payload = json.dumps(
        {
            "chat_id": settings.TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "HTML",
            # The link is for the shop owner to click, not to preview.
            "disable_web_page_preview": True,
        }
    ).encode()

    request = urllib.request.Request(
        _ENDPOINT.format(token=settings.TELEGRAM_BOT_TOKEN, method="sendMessage"),
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.TELEGRAM_TIMEOUT) as response:
            return json.loads(response.read()).get("ok", False)
    except urllib.error.HTTPError as exc:
        # Telegram puts the reason in the body — a wrong chat id and a revoked
        # token look identical without it.
        body = exc.read().decode(errors="replace")[:200]
        logger.warning("Telegram rejected the message: %s %s", exc.code, body)
        return False
    except Exception:
        logger.exception("Could not reach Telegram")
        return False
