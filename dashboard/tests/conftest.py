import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def staff_user(db):
    return User.objects.create_user("staff@example.com", "correct-horse-battery", is_staff=True)


@pytest.fixture
def staff_client(staff_user):
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.fixture
def shopper_client(db):
    shopper = User.objects.create_user("shopper@example.com", "correct-horse-battery")
    client = APIClient()
    client.force_authenticate(user=shopper)
    return client
