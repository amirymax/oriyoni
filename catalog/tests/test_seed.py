"""The seeded catalogue must match what the storefront used to hardcode.

These run against the data the seed migration created when the test database
was built, so they catch a seed file that drifts from the models or loses a
translation.
"""

import pytest

from catalog.models import Category, Color, Product, ProductVariant

pytestmark = [pytest.mark.django_db, pytest.mark.seeded]


def test_every_product_from_the_storefront_is_present():
    assert Product.objects.count() == 11


def test_categories_and_colours_are_present():
    assert Category.objects.count() == 3
    assert Color.objects.count() == 4


def test_a_known_product_survived_the_move_intact():
    tee = Product.objects.get(slug="crown-emblem-tee")

    assert tee.name_en == "Crown Emblem Tee"
    assert tee.name_ru == "Футболка Crown Emblem"
    assert tee.name_tg == "Футболкаи Crown Emblem"
    assert str(tee.price) == "48.00"
    assert tee.tags == ["bestseller"]
    assert tee.category.slug == "tees"
    assert tee.garment == "tee"


@pytest.mark.parametrize("lang", ["ru", "tg"])
def test_nothing_lost_its_translations(lang):
    for product in Product.objects.all():
        assert getattr(product, f"name_{lang}"), product.slug
        assert getattr(product, f"description_{lang}"), product.slug
        assert len(getattr(product, f"details_{lang}")) == len(product.details_en), product.slug


@pytest.mark.parametrize("lang", ["ru", "tg"])
def test_categories_and_colours_are_named_in_every_language(lang):
    for row in [*Category.objects.all(), *Color.objects.all()]:
        assert getattr(row, f"name_{lang}"), row.slug


def test_sale_items_carry_a_higher_compare_price():
    on_sale = Product.objects.filter(tags__contains=["sale"])

    assert on_sale.exists()
    for product in on_sale:
        assert product.compare_at_price > product.price, product.slug


def test_variants_are_the_cross_product_of_colours_and_sizes():
    tee = Product.objects.get(slug="crown-emblem-tee")

    # Two colours across six apparel sizes.
    assert tee.variants.count() == 12


def test_accessories_are_one_size():
    tote = Product.objects.get(slug="canvas-tote")

    assert {variant.size for variant in tote.variants.all()} == {"One Size"}


def test_skus_are_unique_and_readable():
    skus = list(ProductVariant.objects.values_list("sku", flat=True))

    assert len(skus) == len(set(skus))
    assert "ORI-CROWN-EMBLEM-TEE-BLACK-M" in skus


def test_everything_opens_in_stock():
    """A freshly deployed shop should be buyable without touching the admin."""
    assert not ProductVariant.objects.filter(stock=0).exists()


def test_the_catalogue_is_visible_through_the_api(client):
    body = client.get("/api/products/").json()

    assert body["count"] == 11
    slugs = {product["slug"] for product in body["results"]}
    assert "crown-emblem-tee" in slugs
