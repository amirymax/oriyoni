"""Serializers for the admin panel's user management endpoints."""

from rest_framework import serializers

from accounts.models import User
from orders.models import Order


class OrderMiniSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True
    )

    class Meta:
        model = Order
        fields = ["id", "number", "status", "total", "created_at"]


class UserAdminListSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "order_count",
            "created_at",
        ]


class UserAdminDetailSerializer(UserAdminListSerializer):
    orders = serializers.SerializerMethodField()

    class Meta(UserAdminListSerializer.Meta):
        fields = [*UserAdminListSerializer.Meta.fields, "orders"]

    def get_orders(self, user):
        orders = user.orders.order_by("-created_at")[:50]
        return OrderMiniSerializer(orders, many=True).data


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Only `is_active` and `is_staff` are decisions the admin panel makes.

    Everything else about an account — email, name, order history — is
    managed elsewhere or not at all, so it is read-only here rather than
    simply absent: a PATCH that also sends `email` must silently leave it
    untouched.
    """

    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "order_count",
            "created_at",
        ]
        read_only_fields = ["id", "email", "first_name", "last_name", "order_count", "created_at"]
