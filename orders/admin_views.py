"""Admin-panel viewset for order management.

Orders only come from checkout, so there is deliberately no create or
destroy here — just list, retrieve and a status-only update.
"""

from django.utils.dateparse import parse_date
from rest_framework import filters, mixins, viewsets
from rest_framework.permissions import IsAdminUser

from orders.admin_serializers import (
    OrderAdminDetailSerializer,
    OrderAdminListSerializer,
    OrderAdminUpdateSerializer,
)
from orders.models import Order


class OrderAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["number", "email"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return OrderAdminListSerializer
        if self.action in {"update", "partial_update"}:
            return OrderAdminUpdateSerializer
        return OrderAdminDetailSerializer

    def get_queryset(self):
        queryset = Order.objects.select_related("user").prefetch_related("items")
        params = self.request.query_params

        if order_status := params.get("status"):
            queryset = queryset.filter(status=order_status)

        if date_from := parse_date(params.get("date_from", "")):
            queryset = queryset.filter(created_at__date__gte=date_from)

        if date_to := parse_date(params.get("date_to", "")):
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset
