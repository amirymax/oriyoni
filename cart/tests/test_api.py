import pytest

from cart.models import Cart, CartItem
from cart.session import CART_COOKIE
from cart.tests.conftest import CART, ITEMS, ONE_PIXEL_GIF, item_url

pytestmark = pytest.mark.django_db


def add(api, variant, quantity=1):
    return api.post(ITEMS, {"sku": variant.sku, "quantity": quantity}, format="json")


class TestEmptyCart:
    def test_a_visitor_with_no_cart_gets_an_empty_one(self, api):
        response = api.get(CART)

        assert response.status_code == 200
        assert response.json() == {"items": [], "count": 0, "subtotal": 0}

    def test_looking_leaves_no_row_behind(self, api):
        """Otherwise every crawler that passes through creates a cart."""
        api.get(CART)

        assert Cart.objects.count() == 0

    def test_no_cookie_is_set_until_there_is_a_cart(self, api):
        response = api.get(CART)

        assert CART_COOKIE not in response.cookies


class TestAdding:
    def test_adds_a_line(self, api, variant):
        response = add(api, variant, 2)

        assert response.status_code == 201
        body = response.json()
        assert body["count"] == 2
        assert body["items"][0]["sku"] == variant.sku
        assert body["items"][0]["quantity"] == 2

    def test_the_line_carries_what_the_drawer_needs_to_draw_it(self, api, variant):
        """The storefront renders the cart without refetching each product."""
        item = add(api, variant).json()["items"][0]

        assert item["name"] == {"en": "Crown Tee", "ru": "Футболка Crown"}
        assert item["product_slug"] == "crown-tee"
        assert item["garment"] == "tee"
        assert item["size"] == "M"
        assert item["color"]["hex"] == "#0a0a0a"
        assert item["color"]["name"]["ru"] == "Чёрный"

    def test_a_product_without_photos_draws_the_mockup(self, api, variant):
        """Null is the storefront's cue to fall back to the drawn garment."""
        assert add(api, variant).json()["items"][0]["image"] is None

    def test_the_line_carries_the_photo_for_its_colourway(self, api, variant, tee, black, bone):
        from django.core.files.uploadedfile import SimpleUploadedFile

        from catalog.models import ProductImage

        for color, name in ((bone, "bone.gif"), (black, "black.gif")):
            ProductImage.objects.create(
                product=tee,
                color=color,
                image=SimpleUploadedFile(name, ONE_PIXEL_GIF, content_type="image/gif"),
            )

        item = add(api, variant).json()["items"][0]

        assert item["image"].endswith("black.gif")

    def test_totals_are_numbers(self, api, variant):
        body = add(api, variant, 2).json()

        assert body["items"][0]["unit_price"] == 48.0
        assert body["items"][0]["line_total"] == 96.0
        assert body["subtotal"] == 96.0

    def test_adding_the_same_variant_tops_up_the_line(self, api, variant):
        add(api, variant, 2)
        body = add(api, variant, 3).json()

        assert len(body["items"]) == 1
        assert body["items"][0]["quantity"] == 5

    def test_different_variants_are_separate_lines(self, api, variant, other_variant):
        add(api, variant)
        body = add(api, other_variant).json()

        assert len(body["items"]) == 2
        assert body["count"] == 2

    def test_quantity_defaults_to_one(self, api, variant):
        assert add(api, variant).json()["count"] == 1

    def test_sets_a_cookie_so_the_cart_is_found_again(self, api, variant):
        response = add(api, variant)

        assert response.cookies[CART_COOKIE].value
        assert response.cookies[CART_COOKIE]["httponly"]

    def test_the_cart_survives_the_next_request(self, api, variant):
        add(api, variant, 2)

        assert api.get(CART).json()["count"] == 2


class TestAddingRejections:
    def test_an_unknown_sku_is_rejected(self, api):
        response = api.post(ITEMS, {"sku": "NOPE"}, format="json")

        assert response.status_code == 400
        assert "sku" in response.json()["errors"]

    def test_a_deactivated_variant_cannot_be_bought(self, api, variant):
        variant.is_active = False
        variant.save(update_fields=["is_active"])

        assert api.post(ITEMS, {"sku": variant.sku}, format="json").status_code == 400

    def test_a_hidden_product_cannot_be_bought(self, api, variant, tee):
        tee.is_active = False
        tee.save(update_fields=["is_active"])

        assert api.post(ITEMS, {"sku": variant.sku}, format="json").status_code == 400

    def test_more_than_stock_is_refused(self, api, variant):
        response = add(api, variant, variant.stock + 1)

        assert response.status_code == 400
        assert "Only 10 left" in response.json()["errors"]["quantity"][0]

    def test_a_sold_out_variant_says_so(self, api, variant):
        variant.stock = 0
        variant.save(update_fields=["stock"])

        response = add(api, variant, 1)

        assert response.status_code == 400
        assert "sold out" in response.json()["errors"]["quantity"][0]

    def test_topping_up_past_stock_is_refused(self, api, variant):
        """The check is against the whole line, not just what was just added."""
        add(api, variant, 8)

        response = add(api, variant, 5)

        assert response.status_code == 400
        assert api.get(CART).json()["count"] == 8

    def test_zero_and_negative_quantities_are_rejected(self, api, variant):
        assert add(api, variant, 0).status_code == 400
        assert add(api, variant, -1).status_code == 400


class TestUpdating:
    def test_changes_the_quantity(self, api, variant):
        item_id = add(api, variant).json()["items"][0]["id"]

        body = api.patch(item_url(item_id), {"quantity": 4}, format="json").json()

        assert body["items"][0]["quantity"] == 4
        assert body["subtotal"] == 192.0

    def test_zero_removes_the_line(self, api, variant):
        """The storefront's stepper goes to zero rather than calling delete."""
        item_id = add(api, variant).json()["items"][0]["id"]

        body = api.patch(item_url(item_id), {"quantity": 0}, format="json").json()

        assert body["items"] == []
        assert body["count"] == 0

    def test_cannot_exceed_stock(self, api, variant):
        item_id = add(api, variant).json()["items"][0]["id"]

        response = api.patch(item_url(item_id), {"quantity": 99}, format="json")

        assert response.status_code == 400

    def test_removing_a_line(self, api, variant, other_variant):
        item_id = add(api, variant).json()["items"][0]["id"]
        add(api, other_variant)

        body = api.delete(item_url(item_id)).json()

        assert len(body["items"]) == 1

    def test_an_unknown_line_is_a_404(self, api, variant):
        add(api, variant)

        assert api.patch(item_url(99999), {"quantity": 1}, format="json").status_code == 404


class TestIsolation:
    def test_one_visitor_cannot_touch_another_visitors_line(self, api, variant, other_variant):
        """Line ids are sequential, so they must be scoped to the caller's cart."""
        from rest_framework.test import APIClient

        mine = add(api, variant).json()["items"][0]["id"]

        stranger = APIClient()
        add(stranger, other_variant)

        assert stranger.patch(item_url(mine), {"quantity": 9}, format="json").status_code == 404
        assert stranger.delete(item_url(mine)).status_code == 404
        assert api.get(CART).json()["items"][0]["quantity"] == 1

    def test_a_made_up_cookie_does_not_reach_anyone(self, api, variant, user):
        Cart.objects.create(user=user)
        api.cookies[CART_COOKIE] = "not-a-real-token"

        assert api.get(CART).json()["count"] == 0

    def test_a_guest_token_cannot_name_an_account_cart(self, api, variant, user):
        """Even a leaked token must not open a signed-in shopper's cart."""
        owned = Cart.objects.create(user=user)
        CartItem.objects.create(cart=owned, variant=variant, quantity=3)

        api.cookies[CART_COOKIE] = str(owned.token)

        assert api.get(CART).json()["count"] == 0


class TestClearing:
    def test_empties_the_cart(self, api, variant, other_variant):
        add(api, variant)
        add(api, other_variant)

        body = api.delete(CART).json()

        assert body["items"] == []
        assert body["count"] == 0

    def test_keeps_the_cart_itself(self, api, variant):
        add(api, variant)

        api.delete(CART)

        assert Cart.objects.count() == 1


class TestSignedIn:
    def test_the_cart_hangs_off_the_account(self, signed_in, variant, user):
        add(signed_in, variant, 2)

        assert Cart.objects.get(user=user).count == 2

    def test_no_guest_cookie_is_issued(self, signed_in, variant):
        """A signed-in cart is found through the account, not a cookie."""
        response = add(signed_in, variant)

        assert CART_COOKIE not in response.cookies

    def test_the_cart_follows_the_account_to_a_new_browser(self, signed_in, variant, user):
        from rest_framework.test import APIClient

        add(signed_in, variant, 2)

        elsewhere = APIClient()
        elsewhere.post(
            "/api/auth/login/",
            {"email": user.email, "password": "correct-horse-battery"},
            format="json",
        )

        assert elsewhere.get(CART).json()["count"] == 2

    def test_signing_out_leaves_the_cart_behind(self, signed_in, variant, user):
        add(signed_in, variant, 2)
        signed_in.post("/api/auth/logout/")

        assert signed_in.get(CART).json()["count"] == 0
        assert Cart.objects.get(user=user).count == 2


class TestAvailabilityReporting:
    def test_a_line_reports_what_is_left(self, api, variant):
        item = add(api, variant, 2).json()["items"][0]

        assert item["available"] == 10

    def test_a_line_whose_stock_vanished_reports_zero(self, api, variant):
        """The cart still shows it; checkout is where it gets blocked."""
        add(api, variant, 2)
        variant.stock = 0
        variant.save(update_fields=["stock"])

        item = api.get(CART).json()["items"][0]

        assert item["available"] == 0
        assert item["quantity"] == 2
