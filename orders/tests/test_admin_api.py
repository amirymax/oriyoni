"""Admin panel API tests for order management under /api/admin/orders/."""

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from orders.models import Order, OrderItem, OrderStatus

User = get_user_model()

pytestmark = pytest.mark.django_db

ORDERS = "/api/admin/orders/"


def detail(pk):
    return f"{ORDERS}{pk}/"


@pytest.fixture
def staff_client(db):
    staff = User.objects.create_user("staff@example.com", "correct-horse-battery", is_staff=True)
    client = APIClient()
    client.force_authenticate(user=staff)
    return client


@pytest.fixture
def shopper_client(db):
    shopper = User.objects.create_user("shopper@example.com", "correct-horse-battery")
    client = APIClient()
    client.force_authenticate(user=shopper)
    return client


@pytest.fixture
def order(db):
    order = Order.objects.create(
        email="ada@example.com",
        status=OrderStatus.PENDING,
        subtotal=Decimal("48.00"),
        shipping=Decimal("12.00"),
        total=Decimal("60.00"),
        shipping_name="Ada Lovelace",
        shipping_line1="12 Analytical Way",
        shipping_city="London",
        shipping_postal_code="E1 6AN",
        shipping_country="GB",
    )
    OrderItem.objects.create(
        order=order,
        sku="SKU-1",
        product_slug="crown-tee",
        name_en="Crown Tee",
        name_ru="Футболка Crown",
        color_name_en="Black",
        color_name_ru="Чёрный",
        size="M",
        unit_price=Decimal("48.00"),
        quantity=1,
        line_total=Decimal("48.00"),
    )
    return order


class TestPermissionBoundary:
    def test_unauthenticated_is_401(self, api, order):
        assert api.get(ORDERS).status_code == 401
        assert api.get(detail(order.number)).status_code == 401

    def test_non_staff_is_403(self, shopper_client, order):
        assert shopper_client.get(ORDERS).status_code == 403

    def test_staff_is_200(self, staff_client, order):
        assert staff_client.get(ORDERS).status_code == 200
        assert staff_client.get(detail(order.id)).status_code == 200


class TestList:
    def test_shape(self, staff_client, order):
        row = staff_client.get(ORDERS).json()["results"][0]

        assert set(row) == {"id", "number", "email", "status", "item_count", "total", "created_at"}
        assert row["item_count"] == 1
        assert row["total"] == 60.0

    def test_search_by_number(self, staff_client, order):
        body = staff_client.get(ORDERS, {"search": order.number}).json()
        assert body["count"] == 1

    def test_search_by_email(self, staff_client, order):
        assert staff_client.get(ORDERS, {"search": "ada@"}).json()["count"] == 1
        assert staff_client.get(ORDERS, {"search": "nobody@"}).json()["count"] == 0

    def test_filters_by_status(self, staff_client, order):
        assert staff_client.get(ORDERS, {"status": "paid"}).json()["count"] == 0
        assert staff_client.get(ORDERS, {"status": "pending"}).json()["count"] == 1

    def test_filters_by_date_range(self, staff_client, order):
        today = order.created_at.date().isoformat()
        assert staff_client.get(ORDERS, {"date_from": today}).json()["count"] == 1
        assert staff_client.get(ORDERS, {"date_from": "2099-01-01"}).json()["count"] == 0
        assert staff_client.get(ORDERS, {"date_to": "2000-01-01"}).json()["count"] == 0


class TestDetail:
    def test_shape(self, staff_client, order):
        body = staff_client.get(detail(order.id)).json()

        assert body["number"] == order.number
        assert body["shipping_name"] == "Ada Lovelace"
        assert len(body["items"]) == 1
        assert body["items"][0]["sku"] == "SKU-1"


class TestUpdate:
    def test_patch_only_changes_status(self, staff_client, order):
        response = staff_client.patch(
            detail(order.id),
            {
                "status": "paid",
                "email": "hacked@example.com",
                "total": "1.00",
                "shipping_name": "Someone Else",
                "note": "tampered",
            },
            format="json",
        )

        assert response.status_code == 200, response.data
        order.refresh_from_db()
        assert order.status == "paid"
        assert order.email == "ada@example.com"
        assert order.total == Decimal("60.00")
        assert order.shipping_name == "Ada Lovelace"
        assert order.note == ""

    def test_cannot_create_or_delete(self, staff_client, order):
        assert staff_client.post(ORDERS, {}, format="json").status_code == 405
        assert staff_client.delete(detail(order.id)).status_code == 405
