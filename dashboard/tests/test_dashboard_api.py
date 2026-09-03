"""Tests for the admin dashboard's headline numbers."""

from decimal import Decimal

import pytest
from django.utils import timezone

from catalog.models import Category, Color, Product, ProductVariant
from orders.models import Order, OrderStatus

pytestmark = pytest.mark.django_db

DASHBOARD = "/api/admin/dashboard/"


def make_order(status, **overrides):
    defaults = {
        "email": "a@example.com",
        "status": status,
        "subtotal": Decimal("40.00"),
        "shipping": Decimal("0.00"),
        "total": Decimal("40.00"),
        "shipping_name": "A",
        "shipping_line1": "L1",
        "shipping_city": "City",
        "shipping_postal_code": "000",
        "shipping_country": "US",
    }
    defaults.update(overrides)
    return Order.objects.create(**defaults)


class TestPermissionBoundary:
    def test_unauthenticated_is_401(self, api):
        assert api.get(DASHBOARD).status_code == 401

    def test_non_staff_is_403(self, shopper_client):
        assert shopper_client.get(DASHBOARD).status_code == 403

    def test_staff_is_200(self, staff_client):
        assert staff_client.get(DASHBOARD).status_code == 200


class TestNumbers:
    def test_revenue_only_counts_paid_shipped_delivered(self, staff_client):
        make_order(OrderStatus.PENDING, total=Decimal("100.00"))
        make_order(OrderStatus.CANCELLED, total=Decimal("100.00"))
        make_order(OrderStatus.PAID, total=Decimal("10.00"))
        make_order(OrderStatus.SHIPPED, total=Decimal("20.00"))
        make_order(OrderStatus.DELIVERED, total=Decimal("30.00"))

        body = staff_client.get(DASHBOARD).json()

        assert Decimal(str(body["revenue_total"])) == Decimal("60.00")

    def test_revenue_total_is_zero_with_no_orders(self, staff_client):
        body = staff_client.get(DASHBOARD).json()

        assert Decimal(str(body["revenue_total"])) == Decimal("0.00")

    def test_orders_today_and_pending(self, staff_client):
        make_order(OrderStatus.PENDING)
        make_order(OrderStatus.PAID)

        body = staff_client.get(DASHBOARD).json()

        assert body["orders_today"] == 2
        assert body["orders_pending"] == 1

    def test_orders_this_week_excludes_last_week(self, staff_client):
        recent = make_order(OrderStatus.PAID)
        old = make_order(OrderStatus.PAID)
        Order.objects.filter(pk=old.pk).update(
            created_at=timezone.now() - timezone.timedelta(days=10)
        )

        body = staff_client.get(DASHBOARD).json()

        assert body["orders_this_week"] == 1
        assert recent.id  # sanity: fixture created successfully

    def _make_product_with_variants(self):
        category = Category.objects.create(
            slug="tees", name_en="Tees", name_ru="Футболки", name_tg="Футболкаҳо"
        )
        color = Color.objects.create(
            slug="black", name_en="Black", name_ru="Чёрный", name_tg="Сиёҳ", hex="#0a0a0a"
        )
        product = Product.objects.create(
            slug="test-tee",
            name_en="Test Tee",
            name_ru="Тест",
            name_tg="Тест",
            category=category,
            garment="tee",
            price=Decimal("48.00"),
            description_en="d",
            description_ru="d",
            description_tg="d",
        )
        return product, color

    def test_low_stock_counts_active_variants_at_or_below_threshold(self, staff_client):
        product, color = self._make_product_with_variants()
        ProductVariant.objects.create(
            product=product, color=color, size="M", sku="LOW-M", stock=5, is_active=True
        )
        ProductVariant.objects.create(
            product=product, color=color, size="L", sku="OK-L", stock=6, is_active=True
        )
        ProductVariant.objects.create(
            product=product, color=color, size="S", sku="INACTIVE-S", stock=0, is_active=False
        )

        body = staff_client.get(DASHBOARD).json()

        assert body["low_stock_variants"] == 1

    def test_active_products_count(self, staff_client):
        product, _ = self._make_product_with_variants()
        Product.objects.filter(pk=product.pk).update(is_active=False)

        body = staff_client.get(DASHBOARD).json()

        assert body["active_products"] == 0

    def test_total_users_counts_staff_and_shoppers(self, staff_client, staff_user, shopper_client):
        body = staff_client.get(DASHBOARD).json()

        assert body["total_users"] == 2

    def test_recent_orders_shape(self, staff_client):
        order = make_order(OrderStatus.PAID)

        body = staff_client.get(DASHBOARD).json()

        row = body["recent_orders"][0]
        assert set(row) == {"id", "number", "email", "status", "total", "created_at"}
        assert row["number"] == order.number
