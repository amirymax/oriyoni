from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from catalog.models import Category, Color, Product, ProductVariant

User = get_user_model()

PASSWORD = "correct-horse-battery"

CHECKOUT = "/api/orders/checkout/"
ORDERS = "/api/orders/"
CART_ITEMS = "/api/cart/items/"

ADDRESS = {
    "shipping_name": "Ada Lovelace",
    "shipping_line1": "12 Analytical Way",
    "shipping_city": "London",
    "shipping_postal_code": "E1 6AN",
    "shipping_country": "gb",
}


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def guest():
    """A second, always-anonymous client.

    `signed_in` upgrades the `api` client in place, so a test that needs both
    a signed-in and a signed-out caller must ask for two.
    """
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user("ada@example.com", PASSWORD)


@pytest.fixture
def signed_in(api, user):
    response = api.post(
        "/api/auth/login/", {"email": user.email, "password": PASSWORD}, format="json"
    )
    assert response.status_code == 200
    return api


@pytest.fixture
def make_variant(db):
    category = Category.objects.create(slug="tees", name_en="Tees", name_ru="Футболки")
    black = Color.objects.create(
        slug="black", name_en="Black", name_ru="Чёрный", hex="#0a0a0a", is_dark=True
    )

    def _make(slug="crown-tee", price="48.00", size="M", stock=10):
        product = Product.objects.create(
            slug=slug,
            name_en="Crown Tee",
            name_ru="Футболка Crown",
            category=category,
            garment="tee",
            price=Decimal(price),
            description_en="A tee.",
            description_ru="Футболка.",
        )
        return ProductVariant.objects.create(
            product=product,
            color=black,
            size=size,
            sku=f"SKU-{slug}-{size}".upper(),
            stock=stock,
        )

    return _make


@pytest.fixture
def variant(make_variant):
    return make_variant()


def add_to_cart(api, variant, quantity=1):
    response = api.post(CART_ITEMS, {"sku": variant.sku, "quantity": quantity}, format="json")
    assert response.status_code in (200, 201), response.data
    return response


def checkout(api, **overrides):
    return api.post(CHECKOUT, {**ADDRESS, **overrides}, format="json")
