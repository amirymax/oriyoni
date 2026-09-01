"""Telling the shop owner an order came in.

Deliberately thin on detail: the number, what it is worth, and a link. The
customer's address, email and basket contents stay in the admin panel rather
than being copied into a cloud chat that is not end-to-end encrypted and keeps
history forever. The point of the message is to get someone to open the
dashboard, and it does that without carrying anything worth leaking.
"""

import logging

from django.conf import settings

from core.telegram import escape, is_configured, send_message

logger = logging.getLogger(__name__)


def build_message(order, item_count):
    return (
        f"🛍 <b>New order {escape(order.number)}</b>\n"
        f"{item_count} item{'s' if item_count != 1 else ''} · "
        f"${escape(f'{order.total:.2f}')}\n\n"
        f"{escape(settings.FRONTEND_URL)}/admin/orders/{order.pk}"
    )


def notify_new_order(order, item_count):
    """Best effort, and called after the order's transaction has committed.

    Nothing here can be allowed to fail the request: the stock is claimed, the
    cart is emptied and the customer has been charged the moment this runs, so
    an exception would report a failure for an order that very much exists.
    """
    if not is_configured():
        return

    try:
        send_message(build_message(order, item_count))
    except Exception:
        # send_message swallows its own errors; this is for anything raised
        # while building the message.
        logger.exception("Could not announce order %s", order.number)
