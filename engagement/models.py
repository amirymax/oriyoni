"""The two forms the storefront has that are not about buying: the newsletter
signup in the footer and the contact page."""

import uuid

from django.db import models
from django.utils import timezone

from core.languages import LANGUAGE_CHOICES
from core.models import TimeStampedModel


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")

    is_active = models.BooleanField(default=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    # Goes in the unsubscribe link. Opaque, so one address cannot be used to
    # unsubscribe another.
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    def unsubscribe(self):
        self.is_active = False
        self.unsubscribed_at = timezone.now()
        self.save(update_fields=["is_active", "unsubscribed_at", "updated_at"])

    def resubscribe(self, language=None):
        self.is_active = True
        self.unsubscribed_at = None
        if language:
            self.language = language
        self.save(update_fields=["is_active", "unsubscribed_at", "language", "updated_at"])


class ContactMessage(TimeStampedModel):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")

    is_handled = models.BooleanField(default=False, help_text="Tick once someone has replied.")

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_handled", "-created_at"])]

    def __str__(self):
        return f"{self.name} — {self.subject or 'no subject'}"
