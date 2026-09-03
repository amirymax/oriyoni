from rest_framework import serializers

from cart.models import MAX_QUANTITY_PER_LINE, CartItem
from catalog.models import ProductVariant
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
        """The photo for this line's colourway, if the product has any.

        Same rule the storefront uses on a product card — a photo tagged with
        the colour, else one that stands for the product, else the first —
        applied here so the cart does not have to fetch each product to draw
        a thumbnail. Null falls back to the drawn mockup.
        """
        photos = list(item.variant.product.images.all())
        if not photos:
            return None

        color_id = item.variant.color_id
        chosen = next(
            (photo for photo in photos if photo.color_id == color_id),
            next((photo for photo in photos if photo.color_id is None), photos[0]),
        )

        url = chosen.image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


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
