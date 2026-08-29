from unittest.mock import patch

import pytest
from django.db import DatabaseError
from django.urls import reverse


@pytest.mark.django_db
def test_health_reports_ok(client):
    response = client.get(reverse("core:health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


@pytest.mark.django_db
def test_health_is_public(client):
    """The probe must answer without credentials, unlike the rest of the API."""
    response = client.get(reverse("core:health"))

    assert response.status_code == 200


@pytest.mark.django_db
def test_health_reports_503_when_database_is_unreachable(client):
    with patch("core.views.connection.cursor", side_effect=DatabaseError("down")):
        response = client.get(reverse("core:health"))

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}
