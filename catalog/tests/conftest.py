from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from catalog.models import Category, Color, Product, ProductImage, ProductVariant

# The smallest thing ImageField will accept as a picture.
ONE_PIXEL_GIF = (
    b"GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00ccc,\x00\x00\x00\x00\x01\x00"
    b"\x01\x00\x00\x02\x02D\x01\x00;"
)


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture(autouse=True)
def _tmp_media_root(settings, tmp_path):
    """Write uploaded product photos to a throwaway directory.

    Without this, `ProductImageAdminViewSet` tests would write real files
    under the repo's `media/` on every run.
    """
    settings.MEDIA_ROOT = tmp_path


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


@pytest.fixture
def make_image(db):
    """A photo on a product, as an upload from the admin panel would leave it."""

    def _make(product, color=None, position=0, alt_text=""):
        return ProductImage.objects.create(
            product=product,
            color=color,
            position=position,
            alt_text=alt_text,
            image=SimpleUploadedFile(
                f"{product.slug}-{position}.gif", ONE_PIXEL_GIF, content_type="image/gif"
            ),
        )

    return _make
