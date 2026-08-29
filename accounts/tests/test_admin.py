"""Smoke tests for the admin.

Retargeting Django's UserAdmin at a model with no username is easy to get
subtly wrong — a stale field name in `fieldsets` or `ordering` only surfaces
when someone opens the page. These load the pages instead.
"""

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


def test_changelist_loads(admin_client):
    User.objects.create_user("ada@example.com", "correct-horse-battery")

    response = admin_client.get(reverse("admin:accounts_user_changelist"))

    assert response.status_code == 200
    assert b"ada@example.com" in response.content


def test_add_form_loads(admin_client):
    response = admin_client.get(reverse("admin:accounts_user_add"))

    assert response.status_code == 200


def test_change_form_loads(admin_client):
    user = User.objects.create_user("ada@example.com", "correct-horse-battery")

    response = admin_client.get(reverse("admin:accounts_user_change", args=[user.pk]))

    assert response.status_code == 200


def test_search_finds_by_email(admin_client):
    User.objects.create_user("ada@example.com", "correct-horse-battery")
    User.objects.create_user("grace@example.com", "correct-horse-battery")

    response = admin_client.get(reverse("admin:accounts_user_changelist"), {"q": "grace"})

    assert response.status_code == 200
    assert b"grace@example.com" in response.content
    assert b"ada@example.com" not in response.content


def test_admin_creates_a_user_through_the_form(admin_client):
    response = admin_client.post(
        reverse("admin:accounts_user_add"),
        {
            "email": "New@Example.com",
            "usable_password": "true",
            "password1": "correct-horse-battery",
            "password2": "correct-horse-battery",
        },
    )

    assert response.status_code == 302, getattr(response, "context_data", None)
    assert User.objects.filter(email="new@example.com").exists()


def test_non_staff_cannot_reach_the_admin(client):
    User.objects.create_user("ada@example.com", "correct-horse-battery")
    client.login(username="ada@example.com", password="correct-horse-battery")

    response = client.get(reverse("admin:accounts_user_changelist"))

    assert response.status_code == 302
    assert "/admin/login/" in response.url
