"""Serializers for the admin panel's order management endpoints."""

from rest_framework import serializers

from catalog.photos import photo_url_for
from orders.models import Order, OrderItem
from orders.serializers import ADDRESS_FIELDS


def _money(**kwargs):
    return serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True, **kwargs
    )


class OrderItemAdminSerializer(serializers.ModelSerializer):
    unit_price = _money()
    line_total = _money()
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "sku",
            "product_slug",
            "name_en",
            "name_ru",
            "name_tg",
            "color_name_en",
            "color_name_ru",
            "color_name_tg",
            "image",
            "size",
            "unit_price",
            "quantity",
            "line_total",
        ]

    def get_image(self, item):
        """Live, like the storefront's — see `orders.serializers` for why.

        None for a line whose variant has been deleted, or whose product has
        no photography.
        """
        if item.variant is None:
            return None

        return photo_url_for(
            item.variant.product,
            item.variant.color_id,
            self.context.get("request"),
        )


class OrderAdminListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    total = _money()

    class Meta:
        model = Order
        fields = ["id", "number", "email", "status", "item_count", "total", "created_at"]


class OrderAdminDetailSerializer(serializers.ModelSerializer):
    items = OrderItemAdminSerializer(many=True, read_only=True)
    subtotal = _money()
    shipping = _money()
    total = _money()

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "email",
            "status",
            "subtotal",
            "shipping",
            "total",
            *ADDRESS_FIELDS,
            "note",
            "created_at",
            "user",
            "items",
        ]


class OrderAdminUpdateSerializer(serializers.ModelSerializer):
    """Only `status` is a decision the shop makes after the fact.

    Every other field is a snapshot of what the shopper agreed to at
    checkout, so it is declared read-only here rather than merely omitted —
    a PATCH that also sends `total` or an address field must silently leave
    them untouched, not reject the request.
    """

    items = OrderItemAdminSerializer(many=True, read_only=True)
    subtotal = _money()
    shipping = _money()
    total = _money()

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "email",
            "status",
            "subtotal",
            "shipping",
            "total",
            *ADDRESS_FIELDS,
            "note",
            "created_at",
            "user",
            "items",
        ]
        read_only_fields = [
            "id",
            "number",
            "email",
            "subtotal",
            "shipping",
            "total",
            *ADDRESS_FIELDS,
            "note",
            "created_at",
            "user",
        ]
