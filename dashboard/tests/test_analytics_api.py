"""Tests for the admin analytics endpoint."""

from decimal import Decimal

import pytest
from django.utils import timezone

from catalog.models import Category, Product
from orders.models import Order, OrderItem, OrderStatus

pytestmark = pytest.mark.django_db

ANALYTICS = "/api/admin/analytics/"


def make_order_with_item(status, product_slug, name_en, quantity=1, unit_price=Decimal("40.00")):
    line_total = unit_price * quantity
    order = Order.objects.create(
        email="a@example.com",
        status=status,
        subtotal=line_total,
        shipping=Decimal("0.00"),
        total=line_total,
        shipping_name="A",
        shipping_line1="L1",
        shipping_city="City",
        shipping_postal_code="000",
        shipping_country="US",
    )
    OrderItem.objects.create(
        order=order,
        sku=f"SKU-{product_slug}",
        product_slug=product_slug,
        name_en=name_en,
        name_ru=name_en,
        name_tg=name_en,
        color_name_en="Black",
        color_name_ru="Чёрный",
        color_name_tg="Сиёҳ",
        size="M",
        unit_price=unit_price,
        quantity=quantity,
        line_total=line_total,
    )
    return order


class TestPermissionBoundary:
    def test_unauthenticated_is_401(self, api):
        assert api.get(ANALYTICS).status_code == 401

    def test_non_staff_is_403(self, shopper_client):
        assert shopper_client.get(ANALYTICS).status_code == 403

    def test_staff_is_200(self, staff_client):
        assert staff_client.get(ANALYTICS).status_code == 200


class TestDefaults:
    def test_default_range_is_last_30_days(self, staff_client):
        body = staff_client.get(ANALYTICS).json()

        today = timezone.now().date()
        assert body["date_to"] == today.isoformat()
        assert body["date_from"] == (today - timezone.timedelta(days=30)).isoformat()

    def test_explicit_range_is_honoured(self, staff_client):
        body = staff_client.get(
            ANALYTICS, {"date_from": "2026-01-01", "date_to": "2026-01-31"}
        ).json()

        assert body["date_from"] == "2026-01-01"
        assert body["date_to"] == "2026-01-31"

    def test_empty_range_has_zeroed_aggregates(self, staff_client):
        body = staff_client.get(ANALYTICS).json()

        assert body["revenue_series"] == []
        assert body["top_products"] == []
        assert body["category_performance"] == []
        assert body["status_breakdown"] == []
        assert Decimal(str(body["average_order_value"])) == Decimal("0")
        assert body["order_count"] == 0


class TestAggregates:
    def test_revenue_series_only_includes_revenue_statuses(self, staff_client):
        make_order_with_item(OrderStatus.PENDING, "tee", "Tee", unit_price=Decimal("999.00"))
        make_order_with_item(OrderStatus.PAID, "tee", "Tee", unit_price=Decimal("40.00"))

        body = staff_client.get(ANALYTICS).json()

        assert len(body["revenue_series"]) == 1
        assert Decimal(str(body["revenue_series"][0]["revenue"])) == Decimal("40.00")
        assert body["revenue_series"][0]["orders"] == 1

    def test_status_breakdown_covers_every_status_in_range(self, staff_client):
        make_order_with_item(OrderStatus.PENDING, "tee", "Tee")
        make_order_with_item(OrderStatus.CANCELLED, "tee", "Tee")
        make_order_with_item(OrderStatus.PAID, "tee", "Tee")

        body = staff_client.get(ANALYTICS).json()

        by_status = {row["status"]: row["count"] for row in body["status_breakdown"]}
        assert by_status == {"pending": 1, "cancelled": 1, "paid": 1}
        assert body["order_count"] == 3

    def test_top_products_ordered_by_revenue(self, staff_client):
        make_order_with_item(
            OrderStatus.PAID, "cheap-tee", "Cheap Tee", unit_price=Decimal("10.00")
        )
        make_order_with_item(
            OrderStatus.PAID, "pricey-hoodie", "Pricey Hoodie", unit_price=Decimal("200.00")
        )

        body = staff_client.get(ANALYTICS).json()

        assert body["top_products"][0]["product_slug"] == "pricey-hoodie"
        assert body["top_products"][0]["quantity"] == 1

    def test_average_order_value(self, staff_client):
        make_order_with_item(OrderStatus.PAID, "tee", "Tee", unit_price=Decimal("40.00"))
        make_order_with_item(OrderStatus.PAID, "tee", "Tee", unit_price=Decimal("60.00"))

        body = staff_client.get(ANALYTICS).json()

        assert Decimal(str(body["average_order_value"])) == Decimal("50.00")

    def test_category_performance_maps_slugs_to_categories(self, staff_client):
        category = Category.objects.create(
            slug="tees", name_en="Tees", name_ru="Футболки", name_tg="Футболкаҳо"
        )
        Product.objects.create(
            slug="crown-tee",
            name_en="Crown Tee",
            name_ru="Тест",
            name_tg="Тест",
            category=category,
            garment="tee",
            price=Decimal("48.00"),
            description_en="d",
            description_ru="d",
            description_tg="d",
        )
        make_order_with_item(
            OrderStatus.PAID, "crown-tee", "Crown Tee", unit_price=Decimal("48.00")
        )

        body = staff_client.get(ANALYTICS).json()

        assert body["category_performance"] == [
            {
                "category_slug": "tees",
                "name_en": "Tees",
                "quantity": 1,
                "revenue": 48.0,
            }
        ]

    def test_category_performance_buckets_deleted_products_as_unknown(self, staff_client):
        """A product slug with no current Product row must not crash the join."""
        make_order_with_item(
            OrderStatus.PAID, "long-gone-product", "Long Gone", unit_price=Decimal("15.00")
        )

        body = staff_client.get(ANALYTICS).json()

        assert body["category_performance"] == [
            {
                "category_slug": "unknown",
                "name_en": "Unknown",
                "quantity": 1,
                "revenue": 15.0,
            }
        ]
