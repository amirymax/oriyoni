from rest_framework import serializers

from core.languages import LANGUAGES
from engagement.models import ContactMessage


class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    language = serializers.ChoiceField(choices=LANGUAGES, default="en")

    def validate_email(self, value):
        # Lowercased so the unique index treats Ada@… and ada@… as one
        # subscriber, the same way accounts are stored.
        return value.strip().lower()


class UnsubscribeSerializer(serializers.Serializer):
    token = serializers.UUIDField()


class ContactSerializer(serializers.ModelSerializer):
    language = serializers.ChoiceField(choices=LANGUAGES, default="en")

    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message", "language"]
        extra_kwargs = {
            "subject": {"required": False, "allow_blank": True},
            # A long enough floor to reject a stray keypress, short enough not
            # to turn away someone with a one-line question.
            "message": {"min_length": 10, "max_length": 5000},
            "name": {"min_length": 1, "max_length": 200},
        }
