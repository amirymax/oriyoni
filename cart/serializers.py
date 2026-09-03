from rest_framework import serializers

from cart.models import MAX_QUANTITY_PER_LINE, CartItem
from catalog.models import ProductVariant
from catalog.photos import photo_url_for
from catalog.serializers import ColorSerializer
from core.serializers import LocalizedField


def _money(**kwargs):
    return serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True, **kwargs
    )


class CartItemSerializer(serializers.ModelSerializer):
    """One cart line, carrying everything needed to draw it.

    The storefront renders the cart drawer without fetching each product, so
    the line includes the product's name and swatch rather than just an id.
    """

    sku = serializers.CharField(source="variant.sku", read_only=True)
    product_slug = serializers.CharField(source="variant.product.slug", read_only=True)
    name = LocalizedField("name", source="variant.product")
    garment = serializers.CharField(source="variant.product.garment", read_only=True)
    color = ColorSerializer(source="variant.color", read_only=True)
    size = serializers.CharField(source="variant.size", read_only=True)
    image = serializers.SerializerMethodField()

    unit_price = _money()
    line_total = _money()
    available = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "sku",
            "product_slug",
            "name",
            "garment",
            "color",
            "image",
            "size",
            "quantity",
            "unit_price",
            "line_total",
            "available",
        ]
        read_only_fields = ["id"]

    def get_image(self, item):
        """The photo for this line's colourway, so the drawer draws itself.

        Null falls back to the mockup, same as a product with no photography.
        """
        return photo_url_for(
            item.variant.product,
            item.variant.color_id,
            self.context.get("request"),
        )


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True, read_only=True)
    count = serializers.IntegerField(read_only=True)
    subtotal = _money()

    @staticmethod
    def empty():
        """The shape a visitor with no cart yet gets, so clients need no branch."""
        return {"items": [], "count": 0, "subtotal": 0}


class AddItemSerializer(serializers.Serializer):
    """Adds by SKU: the variant is the thing being bought, and it is one field."""

    sku = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_QUANTITY_PER_LINE, default=1)

    def validate_sku(self, value):
        variant = (
            ProductVariant.objects.select_related("product", "color")
            .filter(sku=value, is_active=True, product__is_active=True)
            .first()
        )
        if variant is None:
            raise serializers.ValidationError("That item is not for sale.")
        return variant


class UpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0, max_value=MAX_QUANTITY_PER_LINE)
