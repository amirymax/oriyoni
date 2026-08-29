import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from engagement.models import NewsletterSubscriber
from engagement.serializers import ContactSerializer, SubscribeSerializer, UnsubscribeSerializer

logger = logging.getLogger(__name__)

# The same reply whether or not the address was already on the list. Saying
# "you are already subscribed" would let anyone test addresses against it.
SUBSCRIBE_REPLY = {"detail": "Thanks — check your inbox to confirm nothing went astray."}


class SubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "engagement"

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        language = serializer.validated_data["language"]

        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email, defaults={"language": language}
        )
        if not created:
            # Signing up again after unsubscribing puts them back on.
            subscriber.resubscribe(language)

        return Response(SUBSCRIBE_REPLY, status=status.HTTP_200_OK)


class UnsubscribeView(APIView):
    """Honours the token in the footer of every mailing.

    Answers the same whether or not the token matched: a wrong token means
    they are not subscribed either way, and the alternative is a probe.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "engagement"

    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subscriber = NewsletterSubscriber.objects.filter(
            unsubscribe_token=serializer.validated_data["token"]
        ).first()
        if subscriber is not None:
            subscriber.unsubscribe()

        return Response({"detail": "You have been removed from the list."})


class ContactView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "engagement"

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save()

        _notify_the_shop(message)

        return Response(
            {"detail": "Thanks for writing — we will come back to you shortly."},
            status=status.HTTP_201_CREATED,
        )


def _notify_the_shop(message):
    """Mail the shop so nobody has to watch the admin for new messages.

    Best effort by design. The message is already saved, so a mail server
    having a bad day must not tell the visitor their message failed — they
    would send it again, and the shop would have two. fail_silently only
    covers SMTP errors, so the broader catch handles DNS and socket failures
    too; the traceback still reaches the log.
    """
    try:
        send_mail(
            subject=f"[ORIYONI] {message.subject or 'New message'} — from {message.name}",
            message=(
                f"From: {message.name} <{message.email}>\n"
                f"Language: {message.language}\n\n"
                f"{message.message}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_EMAIL],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Could not notify the shop of contact message %s", message.pk)
