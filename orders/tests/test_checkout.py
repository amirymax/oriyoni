from decimal import Decimal

import pytest

from cart.models import Cart
from orders.models import Order, OrderItem
from orders.tests.conftest import ADDRESS, CHECKOUT, add_to_cart, checkout

pytestmark = pytest.mark.django_db


class TestPlacingAnOrder:
    def test_a_guest_can_buy_without_an_account(self, api, variant):
        """Making an account should not be the price of buying something."""
        add_to_cart(api, variant, 2)

        response = checkout(api, email="guest@example.com")

        assert response.status_code == 201
        assert response.json()["email"] == "guest@example.com"
        assert Order.objects.count() == 1

    def test_a_signed_in_order_is_attached_to_the_account(self, signed_in, variant, user):
        add_to_cart(signed_in, variant, 1)

        checkout(signed_in)

        assert Order.objects.get().user == user

    def test_a_signed_in_shopper_need_not_retype_their_email(self, signed_in, variant, user):
        add_to_cart(signed_in, variant, 1)

        response = checkout(signed_in)

        assert response.json()["email"] == user.email

    def test_a_guest_must_give_an_email(self, api, variant):
        add_to_cart(api, variant, 1)

        response = checkout(api)

        assert response.status_code == 400
        assert "email" in response.json()["errors"]
        assert Order.objects.count() == 0

    def test_the_order_number_is_dated_and_unguessable(self, api, variant):
        add_to_cart(api, variant, 1)

        number = checkout(api, email="guest@example.com").json()["number"]

        assert number.startswith("ORI-")
        assert len(number.split("-")) == 3

    def test_the_country_is_normalised(self, api, variant):
        add_to_cart(api, variant, 1)

        response = checkout(api, email="guest@example.com")

        assert response.json()["shipping_country"] == "GB"

    def test_an_order_starts_pending_because_payment_is_not_wired_up(self, api, variant):
        add_to_cart(api, variant, 1)

        response = checkout(api, email="guest@example.com")

        assert response.json()["status"] == "pending"


class TestTotals:
    def test_subtotal_and_total_add_up(self, api, variant):
        add_to_cart(api, variant, 2)  # 2 × 48.00

        body = checkout(api, email="guest@example.com").json()

        assert body["subtotal"] == 96.0
        assert body["total"] == body["subtotal"] + body["shipping"]

    def test_shipping_is_charged_under_the_threshold(self, api, variant):
        add_to_cart(api, variant, 2)  # 96.00

        body = checkout(api, email="guest@example.com").json()

        assert body["shipping"] == 12.0
        assert body["total"] == 108.0

    def test_shipping_is_free_over_the_threshold(self, api, variant):
        """The storefront promises free delivery over 120 ₽."""
        add_to_cart(api, variant, 3)  # 144.00

        body = checkout(api, email="guest@example.com").json()

        assert body["shipping"] == 0
        assert body["total"] == 144.0

    def test_totals_are_stored_not_recomputed(self, api, variant):
        """Repricing a product must not change what an old order was worth."""
        add_to_cart(api, variant, 2)
        checkout(api, email="guest@example.com")

        variant.product.price = Decimal("99.00")
        variant.product.save(update_fields=["price"])

        assert Order.objects.get().total == Decimal("108.00")


class TestLineSnapshots:
    def test_lines_copy_the_name_and_price(self, api, variant):
        add_to_cart(api, variant, 2)

        item = checkout(api, email="guest@example.com").json()["items"][0]

        assert item["name"] == {"en": "Crown Tee", "ru": "Футболка Crown"}
        assert item["color_name"] == {"en": "Black", "ru": "Чёрный"}
        assert item["size"] == "M"
        assert item["unit_price"] == 48.0
        assert item["line_total"] == 96.0

    def test_renaming_a_product_does_not_rewrite_history(self, api, variant):
        add_to_cart(api, variant, 1)
        checkout(api, email="guest@example.com")

        variant.product.name_en = "Something Else"
        variant.product.save(update_fields=["name_en"])

        assert OrderItem.objects.get().name_en == "Crown Tee"

    def test_deleting_a_variant_leaves_the_line_readable(self, api, variant):
        add_to_cart(api, variant, 1)
        checkout(api, email="guest@example.com")

        variant.delete()

        item = OrderItem.objects.get()
        assert item.variant_id is None
        assert item.name_en == "Crown Tee"
        assert item.unit_price == Decimal("48.00")


class TestStock:
    def test_stock_is_decremented(self, api, variant):
        add_to_cart(api, variant, 3)

        checkout(api, email="guest@example.com")

        variant.refresh_from_db()
        assert variant.stock == 7

    def test_buying_the_last_ones_leaves_none(self, api, variant):
        add_to_cart(api, variant, variant.stock)

        checkout(api, email="guest@example.com")

        variant.refresh_from_db()
        assert variant.stock == 0

    def test_a_line_that_sold_out_meanwhile_is_refused(self, api, variant):
        """The cart check is advisory; this is where stock is actually claimed."""
        add_to_cart(api, variant, 5)
        variant.stock = 2
        variant.save(update_fields=["stock"])

        response = checkout(api, email="guest@example.com")

        assert response.status_code == 400
        assert "only 2 left" in response.json()["errors"]["items"][0]

    def test_a_refused_checkout_changes_nothing(self, api, variant):
        add_to_cart(api, variant, 5)
        variant.stock = 2
        variant.save(update_fields=["stock"])

        checkout(api, email="guest@example.com")

        variant.refresh_from_db()
        assert variant.stock == 2
        assert Order.objects.count() == 0
        assert api.get("/api/cart/").json()["count"] == 5

    def test_a_withdrawn_product_is_refused(self, api, variant):
        add_to_cart(api, variant, 1)
        variant.product.is_active = False
        variant.product.save(update_fields=["is_active"])

        response = checkout(api, email="guest@example.com")

        assert response.status_code == 400
        assert "no longer for sale" in response.json()["errors"]["items"][0]

    def test_one_bad_line_stops_the_whole_order(self, api, make_variant):
        """All or nothing: a partial order would be a surprise, not a service."""
        good = make_variant("tee-a", size="S")
        bad = make_variant("tee-b", size="L", stock=1)
        add_to_cart(api, good, 1)
        add_to_cart(api, bad, 1)
        bad.stock = 0
        bad.save(update_fields=["stock"])

        response = checkout(api, email="guest@example.com")

        assert response.status_code == 400
        good.refresh_from_db()
        assert good.stock == 10
        assert Order.objects.count() == 0


class TestCartAfterwards:
    def test_the_cart_is_emptied(self, api, variant):
        add_to_cart(api, variant, 2)

        checkout(api, email="guest@example.com")

        assert api.get("/api/cart/").json()["count"] == 0

    def test_the_cart_itself_survives_for_the_next_order(self, api, variant):
        add_to_cart(api, variant, 2)

        checkout(api, email="guest@example.com")

        assert Cart.objects.count() == 1

    def test_checking_out_twice_does_not_place_a_second_order(self, api, variant):
        add_to_cart(api, variant, 2)
        checkout(api, email="guest@example.com")

        second = checkout(api, email="guest@example.com")

        assert second.status_code == 400
        assert Order.objects.count() == 1


class TestEmptyCart:
    def test_an_empty_cart_cannot_be_checked_out(self, api, variant):
        add_to_cart(api, variant, 1)
        api.delete("/api/cart/")

        response = checkout(api, email="guest@example.com")

        assert response.status_code == 400
        assert "empty" in response.json()["errors"]["cart"][0]

    def test_no_cart_at_all_cannot_be_checked_out(self, api):
        response = checkout(api, email="guest@example.com")

        assert response.status_code == 400
        assert Order.objects.count() == 0


class TestAddressValidation:
    @pytest.mark.parametrize(
        "missing",
        ["shipping_name", "shipping_line1", "shipping_city", "shipping_postal_code"],
    )
    def test_required_address_fields(self, api, variant, missing):
        add_to_cart(api, variant, 1)

        body = {**ADDRESS, "email": "guest@example.com"}
        del body[missing]

        response = api.post(CHECKOUT, body, format="json")

        assert response.status_code == 400
        assert missing in response.json()["errors"]

    def test_optional_fields_may_be_omitted(self, api, variant):
        add_to_cart(api, variant, 1)

        response = checkout(api, email="guest@example.com")

        assert response.status_code == 201
        assert response.json()["shipping_line2"] == ""
