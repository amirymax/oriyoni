from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from catalog.models import Category, Color, Product, ProductVariant


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def tees(db):
    return Category.objects.create(slug="tees", name_en="Tees", name_ru="Футболки", position=0)


@pytest.fixture
def hoodies(db):
    return Category.objects.create(slug="hoodies", name_en="Hoodies", name_ru="Худи", position=1)


@pytest.fixture
def black(db):
    return Color.objects.create(
        slug="black", name_en="Black", name_ru="Чёрный", hex="#0a0a0a", is_dark=True
    )


@pytest.fixture
def bone(db):
    return Color.objects.create(
        slug="bone", name_en="Bone", name_ru="Молочный", hex="#efe9db", is_dark=False
    )


@pytest.fixture
def make_product(db):
    def _make(slug="test-tee", category=None, **kwargs):
        defaults = {
            "name_en": "Test Tee",
            "name_ru": "Тестовая футболка",
            "garment": "tee",
            "price": Decimal("48.00"),
            "description_en": "An English description.",
            "description_ru": "Описание по-русски.",
            "details_en": ["240gsm cotton"],
            "details_ru": ["Хлопок 240 г/м²"],
        }
        return Product.objects.create(slug=slug, category=category, **{**defaults, **kwargs})

    return _make


@pytest.fixture
def make_variant(db):
    def _make(product, color, size="M", stock=10, **kwargs):
        return ProductVariant.objects.create(
            product=product,
            color=color,
            size=size,
            sku=kwargs.pop("sku", f"SKU-{product.slug}-{color.slug}-{size}"),
            stock=stock,
            **kwargs,
        )

    return _make


@pytest.fixture
def tee(make_product, make_variant, tees, black, bone):
    """A tee in two colours and three sizes."""
    product = make_product(category=tees, tags=["bestseller"])
    for color in (black, bone):
        for size in ("S", "M", "L"):
            make_variant(product, color, size)
    return product
