from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from catalog.models import Category, Color, Product, ProductVariant
from wishlist.models import WishlistItem

User = get_user_model()

pytestmark = pytest.mark.django_db

PASSWORD = "correct-horse-battery"
WISHLIST = "/api/wishlist/"
SYNC = "/api/wishlist/sync/"


def item_url(slug):
    return f"{WISHLIST}{slug}/"


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user("ada@example.com", PASSWORD)


@pytest.fixture
def signed_in(api, user):
    assert (
        api.post(
            "/api/auth/login/", {"email": user.email, "password": PASSWORD}, format="json"
        ).status_code
        == 200
    )
    return api


@pytest.fixture
def products(db):
    category = Category.objects.create(
        slug="tees", name_en="Tees", name_ru="Футболки", name_tg="Футболкаҳо"
    )
    black = Color.objects.create(
        slug="black",
        name_en="Black",
        name_ru="Чёрный",
        name_tg="Сиёҳ",
        hex="#0a0a0a",
        is_dark=True,
    )
    made = []
    for slug in ("crown-tee", "essential-tee"):
        product = Product.objects.create(
            slug=slug,
            name_en=slug.replace("-", " ").title(),
            name_ru="Футболка",
            name_tg="Футболка",
            category=category,
            garment="tee",
            price=Decimal("48.00"),
            description_en="A tee.",
            description_ru="Футболка.",
            description_tg="Футболка.",
        )
        ProductVariant.objects.create(
            product=product, color=black, size="M", sku=f"SKU-{slug}", stock=5
        )
        made.append(product)
    return made


class TestAccess:
    def test_a_wishlist_needs_an_account(self, api):
        """Unlike the cart: the point of saving is that it outlives the browser."""
        assert api.get(WISHLIST).status_code == 401
        assert api.post(WISHLIST, {"slug": "crown-tee"}, format="json").status_code == 401


class TestSaving:
    def test_saves_a_product(self, signed_in, products):
        response = signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        assert response.status_code == 201
        assert [p["slug"] for p in response.json()] == ["crown-tee"]

    def test_returns_whole_products_not_slugs(self, signed_in, products):
        """The wishlist page renders from this one call."""
        product = signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json").json()[0]

        assert product["name"]["en"] == "Crown Tee"
        assert product["price"] == 48.0
        assert product["colors"][0]["slug"] == "black"

    def test_saving_twice_is_not_an_error(self, signed_in, products):
        """The storefront's heart is a toggle; a double tap must leave it saved."""
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")
        response = signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        assert response.status_code == 201
        assert WishlistItem.objects.count() == 1

    def test_newest_first(self, signed_in, products):
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")
        body = signed_in.post(WISHLIST, {"slug": "essential-tee"}, format="json").json()

        assert [p["slug"] for p in body] == ["essential-tee", "crown-tee"]

    def test_an_unknown_product_is_rejected(self, signed_in, products):
        response = signed_in.post(WISHLIST, {"slug": "no-such-thing"}, format="json")

        assert response.status_code == 400
        assert "slug" in response.json()["errors"]

    def test_a_withdrawn_product_cannot_be_saved(self, signed_in, products):
        products[0].is_active = False
        products[0].save(update_fields=["is_active"])

        assert signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json").status_code == 400


class TestRemoving:
    def test_removes_a_product(self, signed_in, products):
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        body = signed_in.delete(item_url("crown-tee")).json()

        assert body == []

    def test_removing_something_unsaved_is_not_an_error(self, signed_in, products):
        response = signed_in.delete(item_url("essential-tee"))

        assert response.status_code == 200


class TestVisibility:
    def test_a_withdrawn_product_drops_out_of_the_list(self, signed_in, products):
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")
        products[0].is_active = False
        products[0].save(update_fields=["is_active"])

        assert signed_in.get(WISHLIST).json() == []

    def test_one_shopper_cannot_see_anothers(self, signed_in, products):
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        stranger = APIClient()
        User.objects.create_user("grace@example.com", PASSWORD)
        stranger.post(
            "/api/auth/login/",
            {"email": "grace@example.com", "password": PASSWORD},
            format="json",
        )

        assert stranger.get(WISHLIST).json() == []

    def test_one_shopper_cannot_remove_anothers(self, signed_in, products):
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        stranger = APIClient()
        User.objects.create_user("grace@example.com", PASSWORD)
        stranger.post(
            "/api/auth/login/",
            {"email": "grace@example.com", "password": PASSWORD},
            format="json",
        )
        stranger.delete(item_url("crown-tee"))

        assert signed_in.get(WISHLIST).json()[0]["slug"] == "crown-tee"


class TestSync:
    def test_folds_local_slugs_into_the_account(self, signed_in, products):
        body = signed_in.post(SYNC, {"slugs": ["crown-tee", "essential-tee"]}, format="json").json()

        assert {p["slug"] for p in body} == {"crown-tee", "essential-tee"}

    def test_adds_rather_than_replaces(self, signed_in, products):
        """What was saved on another device must not be wiped by this browser."""
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        body = signed_in.post(SYNC, {"slugs": ["essential-tee"]}, format="json").json()

        assert {p["slug"] for p in body} == {"crown-tee", "essential-tee"}

    def test_already_saved_slugs_do_not_collide(self, signed_in, products):
        signed_in.post(WISHLIST, {"slug": "crown-tee"}, format="json")

        response = signed_in.post(SYNC, {"slugs": ["crown-tee"]}, format="json")

        assert response.status_code == 200
        assert WishlistItem.objects.count() == 1

    def test_unknown_slugs_are_ignored(self, signed_in, products):
        """A stale localStorage entry should not fail the whole sync."""
        body = signed_in.post(
            SYNC, {"slugs": ["crown-tee", "was-discontinued"]}, format="json"
        ).json()

        assert [p["slug"] for p in body] == ["crown-tee"]

    def test_an_empty_sync_is_harmless(self, signed_in, products):
        assert signed_in.post(SYNC, {"slugs": []}, format="json").status_code == 200

    def test_an_absurd_list_is_refused(self, signed_in, products):
        response = signed_in.post(SYNC, {"slugs": ["x"] * 500}, format="json")

        assert response.status_code == 400
