"""Admin panel API tests for the catalogue endpoints under /api/admin/.

Distinct from `test_admin.py`, which smoke-tests the stock Django admin site.
"""

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from catalog.models import Product, ProductImage, ProductVariant

User = get_user_model()

pytestmark = pytest.mark.django_db

CATEGORIES = "/api/admin/categories/"
COLORS = "/api/admin/colors/"
PRODUCTS = "/api/admin/products/"
PRODUCT_IMAGES = "/api/admin/product-images/"


def detail(base, pk):
    return f"{base}{pk}/"


@pytest.fixture
def staff_user(db):
    return User.objects.create_user("staff@example.com", "correct-horse-battery", is_staff=True)


@pytest.fixture
def staff_client(staff_user):
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.fixture
def shopper_user(db):
    return User.objects.create_user("shopper@example.com", "correct-horse-battery")


@pytest.fixture
def shopper_client(shopper_user):
    client = APIClient()
    client.force_authenticate(user=shopper_user)
    return client


class TestPermissionBoundary:
    """Every new admin endpoint must be staff-only."""

    @pytest.mark.parametrize("url", [CATEGORIES, COLORS, PRODUCTS, PRODUCT_IMAGES])
    def test_unauthenticated_is_401(self, api, url):
        assert api.get(url).status_code == 401

    @pytest.mark.parametrize("url", [CATEGORIES, COLORS, PRODUCTS, PRODUCT_IMAGES])
    def test_non_staff_is_403(self, shopper_client, url):
        assert shopper_client.get(url).status_code == 403

    @pytest.mark.parametrize("url", [CATEGORIES, COLORS, PRODUCTS, PRODUCT_IMAGES])
    def test_staff_is_200(self, staff_client, url):
        assert staff_client.get(url).status_code == 200


class TestCategoryAdmin:
    def test_list_shows_product_count(self, staff_client, tees, tee):
        body = staff_client.get(CATEGORIES).json()

        row = next(c for c in body["results"] if c["slug"] == "tees")
        assert row["product_count"] == 1

    def test_retrieve(self, staff_client, tees):
        body = staff_client.get(detail(CATEGORIES, tees.id)).json()

        assert body == {
            "id": tees.id,
            "slug": "tees",
            "name_en": "Tees",
            "name_ru": "Футболки",
            "name_tg": "Футболкаҳо",
            "position": 0,
            "product_count": 0,
        }

    def test_search(self, staff_client, tees, hoodies):
        body = staff_client.get(CATEGORIES, {"search": "hoo"}).json()

        assert [c["slug"] for c in body["results"]] == ["hoodies"]

    def test_create(self, staff_client):
        response = staff_client.post(
            CATEGORIES,
            {
                "slug": "new-cat",
                "name_en": "New",
                "name_ru": "Новая",
                "name_tg": "Нав",
                "position": 5,
            },
            format="json",
        )

        assert response.status_code == 201, response.data

    def test_delete_with_no_products_succeeds(self, staff_client, hoodies):
        response = staff_client.delete(detail(CATEGORIES, hoodies.id))

        assert response.status_code == 204

    def test_delete_with_products_is_400_not_500(self, staff_client, tee, tees):
        response = staff_client.delete(detail(CATEGORIES, tees.id))

        assert response.status_code == 400
        assert response.json() == {"detail": "Нельзя удалить категорию, в которой ещё есть товары."}


class TestColorAdmin:
    def test_list(self, staff_client, black, bone):
        body = staff_client.get(COLORS).json()

        assert {c["slug"] for c in body["results"]} == {"black", "bone"}

    def test_retrieve(self, staff_client, black):
        body = staff_client.get(detail(COLORS, black.id)).json()

        assert body["hex"] == "#0a0a0a"
        assert body["is_dark"] is True


class TestProductAdminList:
    def test_list_shape(self, staff_client, tee):
        body = staff_client.get(PRODUCTS).json()

        row = body["results"][0]
        assert row["slug"] == tee.slug
        assert row["category"] == {"id": tee.category_id, "slug": "tees", "name_en": "Tees"}
        assert row["in_stock"] is True
        assert row["primary_image"] is None
        assert "description_en" not in row
        assert "variants" not in row

    def test_filters_by_category_id(self, staff_client, tee, tees):
        body = staff_client.get(PRODUCTS, {"category": str(tees.id)}).json()

        assert body["count"] == 1

    def test_filters_by_category_slug(self, staff_client, tee):
        body = staff_client.get(PRODUCTS, {"category": "tees"}).json()

        assert body["count"] == 1

    def test_filters_by_is_active(self, staff_client, tee):
        tee.is_active = False
        tee.save(update_fields=["is_active"])

        assert staff_client.get(PRODUCTS, {"is_active": "true"}).json()["count"] == 0
        assert staff_client.get(PRODUCTS, {"is_active": "false"}).json()["count"] == 1

    def test_filters_by_garment(self, staff_client, tee):
        assert staff_client.get(PRODUCTS, {"garment": "hoodie"}).json()["count"] == 0
        assert staff_client.get(PRODUCTS, {"garment": "tee"}).json()["count"] == 1

    def test_search(self, staff_client, tee):
        assert staff_client.get(PRODUCTS, {"search": "test"}).json()["count"] == 1
        assert staff_client.get(PRODUCTS, {"search": "no-match"}).json()["count"] == 0

    def test_inactive_products_are_not_hidden(self, staff_client, tee):
        """Unlike the shopper-facing endpoint, the admin sees everything."""
        tee.is_active = False
        tee.save(update_fields=["is_active"])

        assert staff_client.get(PRODUCTS).json()["count"] == 1


class TestProductAdminDetail:
    def test_retrieve_includes_variants_and_images(self, staff_client, tee):
        body = staff_client.get(detail(PRODUCTS, tee.id)).json()

        assert len(body["variants"]) == 6
        assert body["images"] == []
        assert body["description_en"] == "An English description."
        variant = body["variants"][0]
        assert set(variant) == {"id", "color", "size", "sku", "stock", "is_active"}
        assert set(variant["color"]) == {"id", "slug", "name_en", "hex"}

    def test_create_with_nested_variants(self, staff_client, tees, black):
        payload = {
            "slug": "brand-new-tee",
            "name_en": "Brand New Tee",
            "name_ru": "Новая футболка",
            "name_tg": "Футболкаи нав",
            "category": tees.id,
            "garment": "tee",
            "price": "40.00",
            "description_en": "d",
            "description_ru": "d",
            "description_tg": "d",
            "variants": [
                {"color": black.id, "size": "M", "sku": "NEW-TEE-M", "stock": 3},
            ],
        }

        response = staff_client.post(PRODUCTS, payload, format="json")

        assert response.status_code == 201, response.data
        product = Product.objects.get(slug="brand-new-tee")
        assert product.variants.count() == 1
        assert product.variants.get().sku == "NEW-TEE-M"

    def test_update_syncs_variants(self, staff_client, tee, black, bone):
        existing = tee.variants.filter(color=black, size="M").get()
        keep = tee.variants.filter(color=black, size="S").get()

        response = staff_client.patch(
            detail(PRODUCTS, tee.id),
            {
                "variants": [
                    {"id": keep.id, "color": black.id, "size": "S", "sku": keep.sku, "stock": 99},
                    {"color": bone.id, "size": "XL", "sku": "NEW-XL", "stock": 7},
                ]
            },
            format="json",
        )

        assert response.status_code == 200, response.data
        remaining_ids = set(tee.variants.values_list("id", flat=True))
        assert existing.id not in remaining_ids
        keep.refresh_from_db()
        assert keep.stock == 99
        assert ProductVariant.objects.filter(product=tee, sku="NEW-XL").exists()

    def test_update_does_not_touch_variants_when_omitted(self, staff_client, tee):
        before = tee.variants.count()

        response = staff_client.patch(
            detail(PRODUCTS, tee.id), {"name_en": "Renamed"}, format="json"
        )

        assert response.status_code == 200, response.data
        assert tee.variants.count() == before

    def test_deleting_a_variant_used_in_an_order_keeps_the_order(
        self, staff_client, tee, black, make_variant
    ):
        from orders.models import Order, OrderItem

        variant = tee.variants.filter(color=black, size="M").get()
        order = Order.objects.create(
            email="a@example.com",
            subtotal=Decimal("48.00"),
            shipping=Decimal("0.00"),
            total=Decimal("48.00"),
            shipping_name="A",
            shipping_line1="L1",
            shipping_city="City",
            shipping_postal_code="000",
            shipping_country="US",
        )
        OrderItem.objects.create(
            order=order,
            variant=variant,
            sku=variant.sku,
            product_slug=tee.slug,
            name_en=tee.name_en,
            name_ru=tee.name_ru,
            name_tg=tee.name_tg,
            color_name_en=black.name_en,
            color_name_ru=black.name_ru,
            color_name_tg=black.name_tg,
            size="M",
            unit_price=Decimal("48.00"),
            quantity=1,
            line_total=Decimal("48.00"),
        )

        remaining = [
            {"id": v.id, "color": v.color_id, "size": v.size, "sku": v.sku, "stock": v.stock}
            for v in tee.variants.exclude(id=variant.id)
        ]
        response = staff_client.patch(
            detail(PRODUCTS, tee.id), {"variants": remaining}, format="json"
        )

        assert response.status_code == 200, response.data
        order.refresh_from_db()
        item = order.items.get()
        assert item.variant_id is None
        assert item.sku == variant.sku


class TestProductImageAdmin:
    def _upload(self, client, product):
        from django.core.files.uploadedfile import SimpleUploadedFile

        image = SimpleUploadedFile(
            "swatch.gif",
            b"GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00ccc,\x00\x00\x00\x00\x01\x00"
            b"\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )
        return client.post(
            PRODUCT_IMAGES,
            {"product": product.id, "image": image, "alt_text": "Front"},
            format="multipart",
        )

    def test_create_via_multipart(self, staff_client, tee):
        response = self._upload(staff_client, tee)

        assert response.status_code == 201, response.data
        assert response.data["alt_text"] == "Front"

    def test_filter_by_product(self, staff_client, tee, make_product, tees):
        other = make_product("other-tee", tees)
        self._upload(staff_client, tee)
        self._upload(staff_client, other)

        body = staff_client.get(PRODUCT_IMAGES, {"product": tee.id}).json()

        assert body["count"] == 1

    def test_update_ignores_image_and_product(self, staff_client, tee, make_product, tees):
        other = make_product("other-tee-2", tees)
        created = self._upload(staff_client, tee).data

        response = staff_client.patch(
            detail(PRODUCT_IMAGES, created["id"]),
            {"alt_text": "Back", "product": other.id},
            format="json",
        )

        assert response.status_code == 200, response.data
        image = ProductImage.objects.get(id=created["id"])
        assert image.alt_text == "Back"
        assert image.product_id == tee.id

    def test_destroy_deletes_the_file(self, staff_client, tee):
        created = self._upload(staff_client, tee).data
        image = ProductImage.objects.get(id=created["id"])
        file_name = image.image.name
        assert image.image.storage.exists(file_name)

        response = staff_client.delete(detail(PRODUCT_IMAGES, created["id"]))

        assert response.status_code == 204
        assert not image.image.storage.exists(file_name)
