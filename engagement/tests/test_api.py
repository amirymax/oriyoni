import pytest
from django.core import mail
from rest_framework.test import APIClient

from engagement.models import ContactMessage, NewsletterSubscriber

pytestmark = pytest.mark.django_db

SUBSCRIBE = "/api/newsletter/"
UNSUBSCRIBE = "/api/newsletter/unsubscribe/"
CONTACT = "/api/contact/"


@pytest.fixture
def api():
    return APIClient()


class TestNewsletter:
    def test_subscribes_an_address(self, api):
        response = api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")

        assert response.status_code == 200
        assert NewsletterSubscriber.objects.get().email == "ada@example.com"

    def test_needs_no_account(self, api):
        """The footer form is for passers-by."""
        assert api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json").status_code == 200

    def test_the_address_is_lowercased(self, api):
        api.post(SUBSCRIBE, {"email": " Ada@Example.COM "}, format="json")

        assert NewsletterSubscriber.objects.get().email == "ada@example.com"

    def test_subscribing_twice_is_not_an_error(self, api):
        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")
        response = api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")

        assert response.status_code == 200
        assert NewsletterSubscriber.objects.count() == 1

    def test_the_reply_does_not_say_whether_they_were_already_on_the_list(self, api):
        """Otherwise the form becomes a way to test addresses."""
        first = api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")
        second = api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")

        assert first.json() == second.json()

    def test_language_is_remembered(self, api):
        api.post(SUBSCRIBE, {"email": "ada@example.com", "language": "ru"}, format="json")

        assert NewsletterSubscriber.objects.get().language == "ru"

    def test_language_defaults_to_english(self, api):
        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")

        assert NewsletterSubscriber.objects.get().language == "en"

    def test_a_malformed_address_is_rejected(self, api):
        response = api.post(SUBSCRIBE, {"email": "nope"}, format="json")

        assert response.status_code == 400
        assert "email" in response.json()["errors"]


class TestUnsubscribe:
    def test_removes_them_from_the_list(self, api):
        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")
        token = NewsletterSubscriber.objects.get().unsubscribe_token

        response = api.post(UNSUBSCRIBE, {"token": str(token)}, format="json")

        assert response.status_code == 200
        subscriber = NewsletterSubscriber.objects.get()
        assert not subscriber.is_active
        assert subscriber.unsubscribed_at is not None

    def test_an_unknown_token_answers_the_same(self, api):
        """A wrong token means they are not subscribed either way."""
        import uuid

        response = api.post(UNSUBSCRIBE, {"token": str(uuid.uuid4())}, format="json")

        assert response.status_code == 200

    def test_a_token_cannot_unsubscribe_someone_else(self, api):
        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")
        api.post(SUBSCRIBE, {"email": "grace@example.com"}, format="json")
        ada = NewsletterSubscriber.objects.get(email="ada@example.com")

        api.post(UNSUBSCRIBE, {"token": str(ada.unsubscribe_token)}, format="json")

        assert NewsletterSubscriber.objects.get(email="grace@example.com").is_active

    def test_signing_up_again_puts_them_back_on(self, api):
        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")
        token = NewsletterSubscriber.objects.get().unsubscribe_token
        api.post(UNSUBSCRIBE, {"token": str(token)}, format="json")

        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")

        subscriber = NewsletterSubscriber.objects.get()
        assert subscriber.is_active
        assert subscriber.unsubscribed_at is None

    def test_a_malformed_token_is_rejected(self, api):
        assert api.post(UNSUBSCRIBE, {"token": "nonsense"}, format="json").status_code == 400


class TestContact:
    payload = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "subject": "Wholesale",
        "message": "Do you supply to stockists in Europe?",
    }

    def test_records_the_message(self, api):
        response = api.post(CONTACT, self.payload, format="json")

        assert response.status_code == 201
        message = ContactMessage.objects.get()
        assert message.name == "Ada Lovelace"
        assert message.subject == "Wholesale"
        assert not message.is_handled

    def test_needs_no_account(self, api):
        assert api.post(CONTACT, self.payload, format="json").status_code == 201

    def test_the_shop_is_notified(self, api, settings):
        """So nobody has to watch the admin for new messages."""
        api.post(CONTACT, self.payload, format="json")

        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == [settings.CONTACT_EMAIL]
        assert "Ada Lovelace" in mail.outbox[0].body
        assert "stockists" in mail.outbox[0].body

    def test_the_senders_address_is_in_the_notification(self, api):
        api.post(CONTACT, self.payload, format="json")

        assert "ada@example.com" in mail.outbox[0].body

    def test_a_subject_is_optional(self, api):
        response = api.post(CONTACT, {**self.payload, "subject": ""}, format="json")

        assert response.status_code == 201

    def test_language_is_recorded(self, api):
        api.post(CONTACT, {**self.payload, "language": "ru"}, format="json")

        assert ContactMessage.objects.get().language == "ru"

    @pytest.mark.parametrize("missing", ["name", "email", "message"])
    def test_required_fields(self, api, missing):
        body = {k: v for k, v in self.payload.items() if k != missing}

        response = api.post(CONTACT, body, format="json")

        assert response.status_code == 400
        assert missing in response.json()["errors"]

    def test_a_one_word_message_is_rejected(self, api):
        """A floor high enough to turn away a stray keypress."""
        response = api.post(CONTACT, {**self.payload, "message": "hi"}, format="json")

        assert response.status_code == 400
        assert ContactMessage.objects.count() == 0

    def test_an_enormous_message_is_rejected(self, api):
        response = api.post(CONTACT, {**self.payload, "message": "x" * 6000}, format="json")

        assert response.status_code == 400

    def test_a_malformed_address_is_rejected(self, api):
        response = api.post(CONTACT, {**self.payload, "email": "nope"}, format="json")

        assert response.status_code == 400

    def test_a_failing_mail_server_does_not_lose_the_message(self, api):
        """The message is already saved, so telling the visitor it failed would
        only make them send it twice."""
        from unittest.mock import patch

        with patch("engagement.views.send_mail", side_effect=OSError("smtp down")):
            response = api.post(CONTACT, self.payload, format="json")

        assert response.status_code == 201
        assert ContactMessage.objects.count() == 1


class TestThrottling:
    def test_the_forms_are_rate_limited(self, api, monkeypatch):
        """Unauthenticated write endpoints are what a spam script looks for."""
        from rest_framework.throttling import ScopedRateThrottle

        monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, "engagement", "2/hour")

        codes = [
            api.post(SUBSCRIBE, {"email": f"a{i}@example.com"}, format="json").status_code
            for i in range(3)
        ]

        assert codes == [200, 200, 429]

    def test_newsletter_and_contact_share_the_limit(self, api, monkeypatch):
        from rest_framework.throttling import ScopedRateThrottle

        monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, "engagement", "1/hour")

        api.post(SUBSCRIBE, {"email": "ada@example.com"}, format="json")

        assert api.post(CONTACT, TestContact.payload, format="json").status_code == 429
