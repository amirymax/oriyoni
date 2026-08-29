from rest_framework import serializers

from catalog.models import Category, Color, Product, ProductVariant
from core.serializers import LocalizedField

# Apparel runs small to large, and accessories carry the one-size token.
# Ordering by column would give XL before XS.
SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]


def _size_key(size):
    try:
        return (0, SIZE_ORDER.index(size))
    except ValueError:
        # An unknown size sorts after the known ones rather than crashing.
        return (1, size)


class CategorySerializer(serializers.ModelSerializer):
    name = LocalizedField("name")

    class Meta:
        model = Category
        fields = ["slug", "name", "position"]


class ColorSerializer(serializers.ModelSerializer):
    name = LocalizedField("name")

    class Meta:
        model = Color
        fields = ["slug", "name", "hex", "is_dark"]


class VariantSerializer(serializers.ModelSerializer):
    color = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        # Stock counts are deliberately not exposed: shoppers need to know
        # whether they can buy, and competitors do not need the numbers.
        fields = ["sku", "color", "size", "in_stock"]


class ProductSerializer(serializers.ModelSerializer):
    name = LocalizedField("name")
    description = LocalizedField("description")
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    # Money as a number, not DRF's default string: the storefront adds these
    # up for display, and the authoritative totals are computed server-side.
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    compare_at_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False
    )

    colors = serializers.SerializerMethodField()
    sizes = serializers.SerializerMethodField()
    is_on_sale = serializers.BooleanField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "slug",
            "name",
            "description",
            "category",
            "garment",
            "price",
            "compare_at_price",
            "tags",
            "colors",
            "sizes",
            "is_on_sale",
            "in_stock",
        ]

    def _active_variants(self, product):
        # Iterating the prefetched list rather than filtering in the database,
        # which would issue a query per product.
        return [variant for variant in product.variants.all() if variant.is_active]

    def get_colors(self, product):
        unique = {}
        for variant in self._active_variants(product):
            unique.setdefault(variant.color.slug, variant.color)
        return ColorSerializer(list(unique.values()), many=True).data

    def get_sizes(self, product):
        sizes = {variant.size for variant in self._active_variants(product)}
        return sorted(sizes, key=_size_key)


class ProductDetailSerializer(ProductSerializer):
    """Adds the copy and the per-variant availability the product page needs."""

    details = LocalizedField("details")
    variants = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = [*ProductSerializer.Meta.fields, "details", "variants"]

    def get_variants(self, product):
        variants = sorted(
            self._active_variants(product),
            key=lambda v: (v.color.slug, _size_key(v.size)),
        )
        return VariantSerializer(variants, many=True).data
