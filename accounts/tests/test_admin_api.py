"""Admin panel API tests for user management under /api/admin/users/."""

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db

USERS = "/api/admin/users/"


def detail(pk):
    return f"{USERS}{pk}/"


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
    def test_unauthenticated_is_401(self, api, staff_user):
        assert api.get(USERS).status_code == 401

    def test_non_staff_is_403(self, shopper_client):
        assert shopper_client.get(USERS).status_code == 403

    def test_staff_is_200(self, staff_client, staff_user):
        assert staff_client.get(USERS).status_code == 200
        assert staff_client.get(detail(staff_user.id)).status_code == 200


class TestList:
    def test_shape(self, staff_client, staff_user, shopper_user):
        row = staff_client.get(USERS).json()["results"][0]

        assert set(row) == {
            "id",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "order_count",
            "created_at",
        }

    def test_search(self, staff_client, staff_user, shopper_user):
        body = staff_client.get(USERS, {"search": "shopper"}).json()
        assert [u["email"] for u in body["results"]] == ["shopper@example.com"]

    def test_filters_by_is_staff(self, staff_client, staff_user, shopper_user):
        body = staff_client.get(USERS, {"is_staff": "true"}).json()
        assert [u["email"] for u in body["results"]] == ["staff@example.com"]

    def test_filters_by_is_active(self, staff_client, staff_user, shopper_user):
        shopper_user.is_active = False
        shopper_user.save(update_fields=["is_active"])

        body = staff_client.get(USERS, {"is_active": "false"}).json()
        assert [u["email"] for u in body["results"]] == ["shopper@example.com"]

    def test_order_count_is_annotated(self, staff_client, shopper_user):
        from orders.models import Order

        Order.objects.create(
            user=shopper_user,
            email=shopper_user.email,
            subtotal=Decimal("10.00"),
            shipping=Decimal("0.00"),
            total=Decimal("10.00"),
            shipping_name="A",
            shipping_line1="L1",
            shipping_city="City",
            shipping_postal_code="000",
            shipping_country="US",
        )

        body = staff_client.get(USERS).json()
        row = next(u for u in body["results"] if u["email"] == shopper_user.email)
        assert row["order_count"] == 1


class TestDetail:
    def test_includes_recent_orders(self, staff_client, shopper_user):
        from orders.models import Order

        Order.objects.create(
            user=shopper_user,
            email=shopper_user.email,
            subtotal=Decimal("10.00"),
            shipping=Decimal("0.00"),
            total=Decimal("10.00"),
            shipping_name="A",
            shipping_line1="L1",
            shipping_city="City",
            shipping_postal_code="000",
            shipping_country="US",
        )

        body = staff_client.get(detail(shopper_user.id)).json()

        assert len(body["orders"]) == 1
        assert set(body["orders"][0]) == {"id", "number", "status", "total", "created_at"}


class TestUpdate:
    def test_patch_only_changes_is_active_and_is_staff(self, staff_client, shopper_user):
        response = staff_client.patch(
            detail(shopper_user.id),
            {
                "is_active": False,
                "is_staff": True,
                "email": "hacked@example.com",
                "first_name": "Hacked",
            },
            format="json",
        )

        assert response.status_code == 200, response.data
        shopper_user.refresh_from_db()
        assert shopper_user.is_active is False
        assert shopper_user.is_staff is True
        assert shopper_user.email == "shopper@example.com"
        assert shopper_user.first_name == ""

    def test_cannot_create_or_delete(self, staff_client, shopper_user):
        assert staff_client.post(USERS, {}, format="json").status_code == 405
        assert staff_client.delete(detail(shopper_user.id)).status_code == 405


class TestSelfLockoutGuard:
    def test_staff_user_cannot_revoke_their_own_admin_access(self, staff_client, staff_user):
        response = staff_client.patch(detail(staff_user.id), {"is_staff": False}, format="json")

        assert response.status_code == 400
        assert response.json() == {
            "detail": "Вы не можете снять права администратора с самого себя."
        }
        staff_user.refresh_from_db()
        assert staff_user.is_staff is True

    def test_staff_user_can_change_their_own_is_active(self, staff_client, staff_user):
        """The guard is specifically about is_staff, not self-editing at all."""
        response = staff_client.patch(detail(staff_user.id), {"is_active": True}, format="json")

        assert response.status_code == 200, response.data

    def test_a_different_staff_user_can_be_demoted(self, staff_client, staff_user):
        other = User.objects.create_user(
            "other-admin@example.com", "correct-horse-battery", is_staff=True
        )

        response = staff_client.patch(detail(other.id), {"is_staff": False}, format="json")

        assert response.status_code == 200, response.data
        other.refresh_from_db()
        assert other.is_staff is False
