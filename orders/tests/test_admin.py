"""Admin smoke tests. Orders are fulfilled from here, so the pages must load."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from orders.models import Order
from orders.tests.conftest import add_to_cart, checkout

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def staff_client(client):
    User.objects.create_superuser("root@example.com", "correct-horse-battery")
    client.login(username="root@example.com", password="correct-horse-battery")
    return client


@pytest.fixture
def order(api, variant):
    add_to_cart(api, variant, 2)
    assert checkout(api, email="guest@example.com").status_code == 201
    return Order.objects.get()


def test_changelist_loads(staff_client, order):
    response = staff_client.get(reverse("admin:orders_order_changelist"))

    assert response.status_code == 200
    assert order.number.encode() in response.content


def test_change_form_loads_with_its_lines(staff_client, order):
    response = staff_client.get(reverse("admin:orders_order_change", args=[order.pk]))

    assert response.status_code == 200
    assert b"Crown Tee" in response.content


def test_orders_cannot_be_created_by_hand(staff_client):
    """They come from checkout; an invented one would have claimed no stock."""
    response = staff_client.get(reverse("admin:orders_order_add"))

    assert response.status_code == 403


def test_status_is_the_only_editable_field(staff_client, order):
    response = staff_client.get(reverse("admin:orders_order_change", args=[order.pk]))
    content = response.content

    assert b'name="status"' in content
    # Totals and the address are a record of what was agreed, not a form.
    assert b'name="total"' not in content
    assert b'name="shipping_name"' not in content


def test_search_finds_an_order_by_number(staff_client, order):
    response = staff_client.get(reverse("admin:orders_order_changelist"), {"q": order.number})

    assert response.status_code == 200
    assert order.number.encode() in response.content
