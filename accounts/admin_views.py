"""Admin-panel viewset for user management.

Accounts are never created or deleted from here — signup owns creation, and
`is_active` is how an account is retired without losing its order history —
so only list, retrieve and a limited update are exposed.
"""

from django.db.models import Count
from rest_framework import filters, mixins, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST

from accounts.admin_serializers import (
    UserAdminDetailSerializer,
    UserAdminListSerializer,
    UserAdminUpdateSerializer,
)
from accounts.models import User

FALSY = {False, "false", "False", "0"}


def _requests_is_staff_false(data):
    return "is_staff" in data and data["is_staff"] in FALSY


class UserAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return UserAdminListSerializer
        if self.action in {"update", "partial_update"}:
            return UserAdminUpdateSerializer
        return UserAdminDetailSerializer

    def get_queryset(self):
        # Explicit despite User.Meta.ordering already matching: pagination
        # warns about an "unordered" queryset once annotate() is involved.
        queryset = User.objects.annotate(order_count=Count("orders")).order_by("-created_at")
        params = self.request.query_params

        if (is_active := params.get("is_active")) is not None:
            if is_active.lower() in {"true", "1"}:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in {"false", "0"}:
                queryset = queryset.filter(is_active=False)

        if (is_staff := params.get("is_staff")) is not None:
            if is_staff.lower() in {"true", "1"}:
                queryset = queryset.filter(is_staff=True)
            elif is_staff.lower() in {"false", "0"}:
                queryset = queryset.filter(is_staff=False)

        return queryset

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk and _requests_is_staff_false(request.data):
            return Response(
                {"detail": "Вы не можете снять права администратора с самого себя."},
                status=HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)
