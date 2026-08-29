"""What happens to a guest cart when its visitor signs in.

Shopping first and signing in at checkout is the normal order, so the basket
has to survive the login form.
"""

import pytest
from rest_framework.test import APIClient

from cart.models import Cart, CartItem
from cart.tests.conftest import CART, ITEMS, PASSWORD

pytestmark = pytest.mark.django_db

LOGIN = "/api/auth/login/"
REGISTER = "/api/auth/register/"


def add(api, variant, quantity=1):
    return api.post(ITEMS, {"sku": variant.sku, "quantity": quantity}, format="json")


def sign_in(api, user):
    response = api.post(LOGIN, {"email": user.email, "password": PASSWORD}, format="json")
    assert response.status_code == 200
    return response


class TestLogin:
    def test_a_guest_cart_follows_its_visitor_in(self, api, variant, user):
        add(api, variant, 2)

        sign_in(api, user)

        assert api.get(CART).json()["count"] == 2
        assert Cart.objects.get(user=user).count == 2

    def test_the_guest_cart_row_is_taken_over_not_duplicated(self, api, variant, user):
        add(api, variant, 2)

        sign_in(api, user)

        assert Cart.objects.count() == 1

    def test_quantities_add_up_rather_than_overwrite(self, api, variant, user):
        """One saved in the account plus two picked up as a guest is three."""
        owned = Cart.objects.create(user=user)
        CartItem.objects.create(cart=owned, variant=variant, quantity=1)
        add(api, variant, 2)

        sign_in(api, user)

        assert Cart.objects.get(user=user).count == 3

    def test_lines_the_account_did_not_have_are_carried_over(
        self, api, variant, other_variant, user
    ):
        owned = Cart.objects.create(user=user)
        CartItem.objects.create(cart=owned, variant=variant, quantity=1)
        add(api, other_variant, 1)

        sign_in(api, user)

        assert Cart.objects.get(user=user).items.count() == 2

    def test_the_guest_cart_is_cleaned_up(self, api, variant, user):
        Cart.objects.create(user=user)
        add(api, variant, 2)
        guest_token = Cart.objects.get(user__isnull=True).token

        sign_in(api, user)

        assert not Cart.objects.filter(token=guest_token).exists()

    def test_merging_cannot_exceed_stock(self, api, variant, user):
        """Two carts that each fit can add up to more than the shop has."""
        variant.stock = 5
        variant.save(update_fields=["stock"])
        owned = Cart.objects.create(user=user)
        CartItem.objects.create(cart=owned, variant=variant, quantity=4)
        add(api, variant, 4)

        sign_in(api, user)

        assert Cart.objects.get(user=user).count == 5

    def test_a_line_that_sold_out_entirely_is_dropped(self, api, variant, user):
        Cart.objects.create(user=user)
        add(api, variant, 2)
        variant.stock = 0
        variant.save(update_fields=["stock"])

        sign_in(api, user)

        assert Cart.objects.get(user=user).items.count() == 0

    def test_signing_in_with_an_empty_hand_keeps_the_saved_cart(self, api, variant, user):
        owned = Cart.objects.create(user=user)
        CartItem.objects.create(cart=owned, variant=variant, quantity=3)

        sign_in(api, user)

        assert api.get(CART).json()["count"] == 3

    def test_signing_in_with_no_cart_at_all_is_fine(self, api, user):
        sign_in(api, user)

        assert api.get(CART).json()["count"] == 0
        assert Cart.objects.count() == 0

    def test_a_stale_cookie_does_not_resurrect_a_deleted_cart(self, api, variant, user):
        add(api, variant, 2)
        sign_in(api, user)

        # The guest cookie is still in the jar but its cart is gone.
        assert api.get(CART).json()["count"] == 2

        api.post("/api/auth/logout/")
        assert api.get(CART).json()["count"] == 0


class TestRegister:
    def test_a_guest_cart_survives_creating_an_account(self, api, variant):
        add(api, variant, 2)

        response = api.post(
            REGISTER, {"email": "new@example.com", "password": PASSWORD}, format="json"
        )

        assert response.status_code == 201
        assert api.get(CART).json()["count"] == 2


class TestIsolationAcrossVisitors:
    def test_one_visitors_cart_is_not_merged_into_another(self, variant, other_variant, user):
        """Only the cart named by *this* request's cookie may be absorbed."""
        stranger = APIClient()
        add(stranger, other_variant, 5)

        mine = APIClient()
        add(mine, variant, 1)
        sign_in(mine, user)

        assert Cart.objects.get(user=user).items.count() == 1
        assert stranger.get(CART).json()["count"] == 5
