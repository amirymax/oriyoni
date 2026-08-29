from decimal import Decimal

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

pytestmark = pytest.mark.django_db

PRODUCTS = "/api/products/"
CATEGORIES = "/api/categories/"


def detail(slug):
    return f"{PRODUCTS}{slug}/"


class TestAccess:
    def test_catalogue_is_public(self, api, tee):
        """The rest of the API needs credentials; browsing must not."""
        assert api.get(PRODUCTS).status_code == 200
        assert api.get(detail(tee.slug)).status_code == 200
        assert api.get(CATEGORIES).status_code == 200

    def test_is_read_only(self, api, tee, tees):
        assert api.post(PRODUCTS, {"slug": "x"}, format="json").status_code == 405
        assert api.delete(detail(tee.slug)).status_code == 405


class TestListShape:
    def test_returns_a_paginated_envelope(self, api, tee):
        body = api.get(PRODUCTS).json()

        assert body["count"] == 1
        assert len(body["results"]) == 1

    def test_bilingual_text_arrives_in_both_languages(self, api, tee):
        """The storefront switches language without another round trip."""
        product = api.get(PRODUCTS).json()["results"][0]

        assert product["name"] == {"en": "Test Tee", "ru": "Тестовая футболка"}
        assert product["description"]["ru"] == "Описание по-русски."

    def test_price_is_a_number_not_a_string(self, api, tee):
        product = api.get(PRODUCTS).json()["results"][0]

        assert product["price"] == 48.0

    def test_colors_are_deduplicated_across_variants(self, api, tee):
        """Six variants, two colours."""
        product = api.get(PRODUCTS).json()["results"][0]

        assert [c["slug"] for c in product["colors"]] == ["black", "bone"]
        assert product["colors"][0]["hex"] == "#0a0a0a"
        assert product["colors"][0]["is_dark"] is True
        assert product["colors"][0]["name"]["ru"] == "Чёрный"

    def test_sizes_run_small_to_large(self, api, tee):
        """Alphabetical order would put XL before XS."""
        product = api.get(PRODUCTS).json()["results"][0]

        assert product["sizes"] == ["S", "M", "L"]

    def test_category_is_its_slug(self, api, tee):
        product = api.get(PRODUCTS).json()["results"][0]

        assert product["category"] == "tees"

    def test_variants_are_not_in_the_list(self, api, tee):
        """Only the product page needs per-variant availability."""
        product = api.get(PRODUCTS).json()["results"][0]

        assert "variants" not in product

    def test_stock_counts_are_never_exposed(self, api, tee):
        body = api.get(PRODUCTS).content.decode()

        assert "stock" not in body.replace("in_stock", "")


class TestDetailShape:
    def test_adds_details_and_variants(self, api, tee):
        product = api.get(detail(tee.slug)).json()

        assert product["details"] == {
            "en": ["240gsm cotton"],
            "ru": ["Хлопок 240 г/м²"],
        }
        assert len(product["variants"]) == 6

    def test_variants_carry_sku_colour_size_and_availability(self, api, tee):
        variant = api.get(detail(tee.slug)).json()["variants"][0]

        assert set(variant) == {"sku", "color", "size", "in_stock"}
        assert variant["color"] == "black"
        assert variant["in_stock"] is True

    def test_unknown_slug_is_a_404(self, api):
        assert api.get(detail("no-such-product")).status_code == 404


class TestAvailability:
    def test_sold_out_variant_is_reported(self, api, tee, black):
        variant = tee.variants.filter(color=black, size="M").get()
        variant.stock = 0
        variant.save(update_fields=["stock"])

        variants = api.get(detail(tee.slug)).json()["variants"]
        sold_out = [v for v in variants if v["color"] == "black" and v["size"] == "M"]

        assert sold_out[0]["in_stock"] is False

    def test_product_is_in_stock_while_any_variant_is(self, api, tee):
        tee.variants.exclude(size="S").update(stock=0)

        assert api.get(PRODUCTS).json()["results"][0]["in_stock"] is True

    def test_product_is_out_of_stock_when_every_variant_is(self, api, tee):
        tee.variants.update(stock=0)

        assert api.get(PRODUCTS).json()["results"][0]["in_stock"] is False

    def test_deactivated_variant_drops_its_colour(self, api, tee, bone):
        tee.variants.filter(color=bone).update(is_active=False)

        product = api.get(PRODUCTS).json()["results"][0]

        assert [c["slug"] for c in product["colors"]] == ["black"]


class TestVisibility:
    def test_inactive_products_are_hidden(self, api, tee):
        tee.is_active = False
        tee.save(update_fields=["is_active"])

        assert api.get(PRODUCTS).json()["count"] == 0
        assert api.get(detail(tee.slug)).status_code == 404


class TestFilters:
    @pytest.fixture
    def catalogue(self, make_product, make_variant, tees, hoodies, black):
        tee = make_product("crown-tee", tees, name_en="Crown Tee", price=Decimal("48.00"))
        hoodie = make_product(
            "zip-hoodie",
            hoodies,
            name_en="Zip Hoodie",
            name_ru="Худи на молнии",
            price=Decimal("102.00"),
            compare_at_price=Decimal("120.00"),
            tags=["sale"],
        )
        for product in (tee, hoodie):
            make_variant(product, black)
        return tee, hoodie

    def test_filters_by_category(self, api, catalogue):
        body = api.get(PRODUCTS, {"category": "hoodies"}).json()

        assert [p["slug"] for p in body["results"]] == ["zip-hoodie"]

    def test_filters_by_tag(self, api, catalogue):
        body = api.get(PRODUCTS, {"tag": "sale"}).json()

        assert [p["slug"] for p in body["results"]] == ["zip-hoodie"]

    def test_filters_to_sale_items(self, api, catalogue):
        body = api.get(PRODUCTS, {"on_sale": "true"}).json()

        assert [p["slug"] for p in body["results"]] == ["zip-hoodie"]
        assert body["results"][0]["is_on_sale"] is True

    def test_searches_english_names(self, api, catalogue):
        body = api.get(PRODUCTS, {"search": "crown"}).json()

        assert [p["slug"] for p in body["results"]] == ["crown-tee"]

    def test_searches_russian_names(self, api, catalogue):
        """A visitor reading in Russian types Russian."""
        body = api.get(PRODUCTS, {"search": "молнии"}).json()

        assert [p["slug"] for p in body["results"]] == ["zip-hoodie"]

    def test_search_is_case_insensitive(self, api, catalogue):
        assert api.get(PRODUCTS, {"search": "CROWN"}).json()["count"] == 1

    def test_orders_by_price(self, api, catalogue):
        body = api.get(PRODUCTS, {"ordering": "-price"}).json()

        assert [p["slug"] for p in body["results"]] == ["zip-hoodie", "crown-tee"]

    def test_unknown_ordering_is_ignored_not_an_error(self, api, catalogue):
        """Otherwise a stray query param takes the shop page down."""
        response = api.get(PRODUCTS, {"ordering": "price; DROP TABLE"})

        assert response.status_code == 200
        assert response.json()["count"] == 2

    def test_unknown_category_returns_nothing(self, api, catalogue):
        assert api.get(PRODUCTS, {"category": "nope"}).json()["count"] == 0


class TestCategories:
    def test_lists_in_navigation_order(self, api, tees, hoodies):
        body = api.get(CATEGORIES).json()

        assert [c["slug"] for c in body] == ["tees", "hoodies"]
        assert body[0]["name"] == {"en": "Tees", "ru": "Футболки"}


class TestQueryCount:
    """Colours and sizes are read off prefetched variants, not queried per row.

    The absolute number matters less than it staying put as the catalogue
    grows, so these compare two sizes of catalogue rather than pinning a
    figure that a harmless extra prefetch would break.
    """

    def stock(self, indices, make_product, make_variant, category, colors):
        for i in indices:
            product = make_product(f"tee-{i}", category)
            for color in colors:
                make_variant(product, color, size="M", sku=f"SKU-{i}-{color.slug}")

    def queries_for(self, api, url):
        with CaptureQueriesContext(connection) as captured:
            assert api.get(url).status_code == 200
        return len(captured)

    def test_listing_does_not_scale_queries_with_products(
        self, api, make_product, make_variant, tees, black, bone
    ):
        self.stock(range(3), make_product, make_variant, tees, (black, bone))
        few = self.queries_for(api, PRODUCTS)

        self.stock(range(3, 12), make_product, make_variant, tees, (black, bone))
        many = self.queries_for(api, PRODUCTS)

        assert api.get(PRODUCTS).json()["count"] == 12
        assert few == many

    def test_detail_is_a_handful_of_queries(self, api, tee):
        assert self.queries_for(api, detail(tee.slug)) <= 3
