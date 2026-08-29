from rest_framework import serializers

from core.serializers import LocalizedField
from orders.models import Order, OrderItem

ADDRESS_FIELDS = [
    "shipping_name",
    "shipping_line1",
    "shipping_line2",
    "shipping_city",
    "shipping_postal_code",
    "shipping_country",
    "shipping_phone",
]


def _money(**kwargs):
    return serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True, **kwargs
    )


class OrderItemSerializer(serializers.ModelSerializer):
    # Reads the snapshot on the line, not the live product: an order shows
    # what was bought, under the name and price it was bought at.
    name = LocalizedField("name")
    color_name = LocalizedField("color_name")
    unit_price = _money()
    line_total = _money()

    class Meta:
        model = OrderItem
        fields = [
            "sku",
            "product_slug",
            "name",
            "color_name",
            "size",
            "quantity",
            "unit_price",
            "line_total",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    subtotal = _money()
    shipping = _money()
    total = _money()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "number",
            "status",
            "status_label",
            "email",
            "subtotal",
            "shipping",
            "total",
            "item_count",
            "items",
            "note",
            "created_at",
            *ADDRESS_FIELDS,
        ]


class CheckoutSerializer(serializers.ModelSerializer):
    """What the checkout form sends.

    Email is optional for a signed-in shopper — their account's address is
    used — and required for a guest, who has no other way to be reached.
    """

    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = ["email", "note", *ADDRESS_FIELDS]
        extra_kwargs = {
            "shipping_line2": {"required": False},
            "shipping_phone": {"required": False},
            "note": {"required": False},
        }

    def validate_shipping_country(self, value):
        return value.upper()

    def validate(self, attrs):
        user = self.context["request"].user
        email = (attrs.get("email") or "").strip()

        if not email:
            if not (user and user.is_authenticated):
                raise serializers.ValidationError(
                    {"email": ["An email address is needed to send the confirmation."]}
                )
            email = user.email

        attrs["email"] = email
        return attrs

    def to_address(self):
        return {field: self.validated_data.get(field, "") for field in ADDRESS_FIELDS}
