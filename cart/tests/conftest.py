from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from catalog.models import Category, Color, Product, ProductVariant

User = get_user_model()

PASSWORD = "correct-horse-battery"

CART = "/api/cart/"
ITEMS = "/api/cart/items/"


def item_url(pk):
    return f"{ITEMS}{pk}/"


@pytest.fixture
def api():
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
def tee(db):
    category = Category.objects.create(slug="tees", name_en="Tees", name_ru="Футболки")
    return Product.objects.create(
        slug="crown-tee",
        name_en="Crown Tee",
        name_ru="Футболка Crown",
        category=category,
        garment="tee",
        price=Decimal("48.00"),
        description_en="A tee.",
        description_ru="Футболка.",
    )


@pytest.fixture
def black(db):
    return Color.objects.create(
        slug="black", name_en="Black", name_ru="Чёрный", hex="#0a0a0a", is_dark=True
    )


@pytest.fixture
def bone(db):
    return Color.objects.create(slug="bone", name_en="Bone", name_ru="Молочный", hex="#efe9db")


@pytest.fixture
def make_variant(db):
    def _make(product, color, size="M", stock=10):
        return ProductVariant.objects.create(
            product=product,
            color=color,
            size=size,
            sku=f"SKU-{product.slug}-{color.slug}-{size}".upper(),
            stock=stock,
        )

    return _make


@pytest.fixture
def variant(tee, black, make_variant):
    return make_variant(tee, black)


@pytest.fixture
def other_variant(tee, bone, make_variant):
    return make_variant(tee, bone, size="L")
