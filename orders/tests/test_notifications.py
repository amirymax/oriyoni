"""Telling the shop owner an order arrived.

What matters most here is what happens when Telegram does not cooperate. By
the time any of this runs the order is committed, the stock is claimed and the
cart is emptied, so nothing in this path may turn a completed purchase into an
error the customer sees.
"""

from unittest.mock import patch

import pytest

from orders.models import Order
from orders.notifications import build_message, notify_new_order
from orders.tests.conftest import add_to_cart, checkout

pytestmark = pytest.mark.django_db


@pytest.fixture
def configured(settings):
    settings.TELEGRAM_BOT_TOKEN = "123:not-a-real-token"
    settings.TELEGRAM_CHAT_ID = "42"
    return settings


@pytest.fixture
def order(api, variant):
    add_to_cart(api, variant, 2)
    assert checkout(api, email="ada@example.com").status_code == 201
    return Order.objects.get()


class TestMessage:
    def test_it_names_the_order_and_links_to_the_dashboard(self, settings, order):
        settings.FRONTEND_URL = "https://oriyoni.shop"

        message = build_message(order, item_count=3)

        assert order.number in message
        assert f"https://oriyoni.shop/admin/orders/{order.pk}" in message

    def test_it_carries_no_customer_details(self, order):
        """The link is the payload; a cloud chat is no place for an address."""
        message = build_message(order, item_count=1)

        assert order.email not in message
        assert order.shipping_name not in message
        assert order.shipping_line1 not in message

    def test_it_counts_a_single_item_in_the_singular(self, order):
        assert "1 item ·" in build_message(order, item_count=1)
        assert "2 items ·" in build_message(order, item_count=2)


class TestDelivery:
    def test_nothing_is_sent_when_no_bot_is_configured(self, settings, order):
        settings.TELEGRAM_BOT_TOKEN = ""
        settings.TELEGRAM_CHAT_ID = ""

        with patch("orders.notifications.send_message") as send:
            notify_new_order(order, 1)

        send.assert_not_called()

    def test_it_sends_once_when_configured(self, configured, order):
        with patch("orders.notifications.send_message") as send:
            notify_new_order(order, 1)

        assert send.call_count == 1

    def test_a_raised_failure_is_swallowed(self, configured, order):
        with patch("orders.notifications.send_message", side_effect=OSError("no route")):
            notify_new_order(order, 1)  # must not raise


class TestCheckout:
    """The whole point: a broken bot must not cost a sale."""

    def test_an_order_completes_when_telegram_is_unreachable(self, configured, api, variant):
        add_to_cart(api, variant, 1)

        with patch("core.telegram.urllib.request.urlopen", side_effect=TimeoutError("timed out")):
            response = checkout(api, email="ada@example.com")

        assert response.status_code == 201
        assert Order.objects.count() == 1

    def test_an_order_completes_when_telegram_rejects_the_message(self, configured, api, variant):
        add_to_cart(api, variant, 1)

        with patch("orders.notifications.send_message", return_value=False):
            response = checkout(api, email="ada@example.com")

        assert response.status_code == 201

    def test_a_completed_checkout_announces_the_order(self, configured, api, variant):
        add_to_cart(api, variant, 1)

        with patch("orders.notifications.send_message") as send:
            response = checkout(api, email="ada@example.com")

        assert response.status_code == 201
        assert send.call_count == 1
        assert response.json()["number"] in send.call_args.args[0]

    def test_a_failed_checkout_announces_nothing(self, configured, api):
        """No cart, no order, so nothing to announce."""
        with patch("orders.notifications.send_message") as send:
            response = checkout(api, email="ada@example.com")

        assert response.status_code == 400
        send.assert_not_called()
