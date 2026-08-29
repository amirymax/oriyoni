import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from orders.models import Order
from orders.tests.conftest import ORDERS, PASSWORD, add_to_cart, checkout

User = get_user_model()

pytestmark = pytest.mark.django_db


def order_url(number):
    return f"{ORDERS}{number}/"


def place(client, variant, quantity=1, **kwargs):
    add_to_cart(client, variant, quantity)
    response = checkout(client, **kwargs)
    assert response.status_code == 201, response.data
    return response.json()


class TestListing:
    def test_requires_signing_in(self, api):
        assert api.get(ORDERS).status_code == 401

    def test_shows_the_shoppers_own_orders(self, signed_in, variant):
        place(signed_in, variant)

        body = signed_in.get(ORDERS).json()

        assert body["count"] == 1
        assert body["results"][0]["items"][0]["sku"] == variant.sku

    def test_newest_first(self, signed_in, make_variant):
        first = place(signed_in, make_variant("tee-a", size="S"))
        second = place(signed_in, make_variant("tee-b", size="L"))

        numbers = [o["number"] for o in signed_in.get(ORDERS).json()["results"]]

        assert numbers == [second["number"], first["number"]]

    def test_another_shoppers_orders_are_not_listed(self, signed_in, variant, make_variant):
        place(signed_in, variant)

        stranger = APIClient()
        User.objects.create_user("grace@example.com", PASSWORD)
        stranger.post(
            "/api/auth/login/",
            {"email": "grace@example.com", "password": PASSWORD},
            format="json",
        )

        assert stranger.get(ORDERS).json()["count"] == 0

    def test_guest_orders_are_not_listed_against_an_account(self, guest, signed_in, variant):
        """A guest order has no account to belong to."""
        place(guest, variant, email="guest@example.com")

        assert signed_in.get(ORDERS).json()["count"] == 0


class TestDetail:
    def test_returns_the_order(self, signed_in, variant):
        placed = place(signed_in, variant, 2)

        body = signed_in.get(order_url(placed["number"])).json()

        assert body["number"] == placed["number"]
        assert body["item_count"] == 2
        assert body["shipping_name"] == "Ada Lovelace"

    def test_requires_signing_in(self, guest, signed_in, variant):
        placed = place(signed_in, variant)

        assert guest.get(order_url(placed["number"])).status_code == 401

    def test_another_shoppers_order_is_not_found(self, signed_in, variant):
        """Not 403: telling them it exists is itself information."""
        placed = place(signed_in, variant)

        stranger = APIClient()
        User.objects.create_user("grace@example.com", PASSWORD)
        stranger.post(
            "/api/auth/login/",
            {"email": "grace@example.com", "password": PASSWORD},
            format="json",
        )

        assert stranger.get(order_url(placed["number"])).status_code == 404

    def test_an_unknown_number_is_a_404(self, signed_in):
        assert signed_in.get(order_url("ORI-20260101-AAAAAA")).status_code == 404


class TestNumbers:
    def test_numbers_are_unique_across_orders(self, signed_in, make_variant):
        numbers = {
            place(signed_in, make_variant(f"tee-{i}", size=str(i)))["number"] for i in range(5)
        }

        assert len(numbers) == 5

    def test_numbers_are_not_sequential(self, signed_in, make_variant):
        """Sequential numbers would tell a shopper how many orders the shop takes."""
        first = place(signed_in, make_variant("tee-a", size="S"))["number"]
        second = place(signed_in, make_variant("tee-b", size="L"))["number"]

        assert first.split("-")[2] != second.split("-")[2]


class TestOrderState:
    def test_status_carries_a_readable_label(self, signed_in, variant):
        placed = place(signed_in, variant)

        assert placed["status"] == "pending"
        assert placed["status_label"] == "Pending payment"

    def test_closing_an_account_keeps_the_order(self, signed_in, variant, user):
        """Accounting needs the record even when the customer is gone."""
        place(signed_in, variant)

        user.delete()

        order = Order.objects.get()
        assert order.user_id is None
        assert order.email == "ada@example.com"
