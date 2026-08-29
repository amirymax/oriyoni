"""Admin smoke tests — the shop is managed from here, so the pages must load."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_client(client):
    User.objects.create_superuser("root@example.com", "correct-horse-battery")
    client.login(username="root@example.com", password="correct-horse-battery")
    return client


@pytest.mark.parametrize("model", ["category", "color", "product", "productvariant"])
def test_changelists_load(admin_client, model, tee):
    response = admin_client.get(reverse(f"admin:catalog_{model}_changelist"))

    assert response.status_code == 200


@pytest.mark.parametrize("model", ["category", "color", "product", "productvariant"])
def test_add_forms_load(admin_client, model):
    response = admin_client.get(reverse(f"admin:catalog_{model}_add"))

    assert response.status_code == 200


def test_product_change_form_loads_with_its_variant_inline(admin_client, tee):
    response = admin_client.get(reverse("admin:catalog_product_change", args=[tee.pk]))

    assert response.status_code == 200
    assert b"variants" in response.content.lower()


def test_colour_changelist_renders_a_swatch(admin_client, black):
    response = admin_client.get(reverse("admin:catalog_color_changelist"))

    assert b"#0a0a0a" in response.content


def test_stock_can_be_edited_from_the_variant_list(admin_client, tee):
    """list_editable is how stock actually gets updated day to day."""
    response = admin_client.get(reverse("admin:catalog_productvariant_changelist"))

    assert response.status_code == 200
    assert b'name="form-0-stock"' in response.content
