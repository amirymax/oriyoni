"""Serializers for the admin panel's catalogue management endpoints.

Unlike the shopper-facing serializers in `catalog/serializers.py`, these speak
plain per-language columns rather than the folded
`{"en": …, "ru": …, "tg": …}` shape, and expose the internal bits (stock,
ids, timestamps) a merchandiser needs but a shopper does not.
"""

from django.db import IntegrityError, transaction
from rest_framework import serializers

from catalog.models import Category, Color, Product, ProductImage, ProductVariant

_DUPLICATE_VARIANT_ERROR = (
    "Один из вариантов дублирует существующий артикул или комбинацию цвета и размера."
)


class CategoryAdminSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "slug", "name_en", "name_ru", "name_tg", "position", "product_count"]


class ColorAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["id", "slug", "name_en", "name_ru", "name_tg", "hex", "is_dark"]


class CategoryMiniSerializer(serializers.ModelSerializer):
    """The nested shape a product list row shows for its category."""

    class Meta:
        model = Category
        fields = ["id", "slug", "name_en"]


class ColorPKField(serializers.PrimaryKeyRelatedField):
    """Accepts a colour id on write, renders the swatch on read.

    A plain `PrimaryKeyRelatedField` would echo back just the id, but the
    variant editor needs the swatch and names without a second round trip.
    """

    def use_pk_only_optimization(self):
        # The default optimization hands `to_representation` a bare
        # `PKOnlyObject` instead of the real `Color`, since a plain PK field
        # never needs more than the id. This field renders the swatch, so it
        # needs the full, prefetched instance.
        return False

    def to_representation(self, value):
        return {
            "id": value.pk,
            "slug": value.slug,
            "name_en": value.name_en,
            "hex": value.hex,
        }


class VariantAdminSerializer(serializers.ModelSerializer):
    """One row of the writable `variants` list on the product detail endpoint.

    `id` is optional: present it to update an existing variant, omit it to
    create a new one. Uniqueness is enforced by the database and translated
    into a validation error in `ProductAdminDetailSerializer`, rather than by
    the usual auto-generated validators — those assume one object per
    request and misfire here, where several sibling rows are validated
    independently in the same call.
    """

    id = serializers.IntegerField(required=False)
    color = ColorPKField(queryset=Color.objects.all())

    class Meta:
        model = ProductVariant
        fields = ["id", "color", "size", "sku", "stock", "is_active"]
        extra_kwargs = {"sku": {"validators": []}}
        validators = []


class ProductImageMiniSerializer(serializers.ModelSerializer):
    """The `primary_image` shape on a product list row."""

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text"]


class ProductImageNestedSerializer(serializers.ModelSerializer):
    """The read-only `images` list on the product detail endpoint.

    Uploading, reordering and deleting photos happens through
    `/api/admin/product-images/`, not through this field.
    """

    class Meta:
        model = ProductImage
        fields = ["id", "image", "color", "alt_text", "position"]
        read_only_fields = fields


class ProductImageAdminSerializer(serializers.ModelSerializer):
    """The standalone `/api/admin/product-images/` shape.

    `image` is a file on create and renders as a URL on read; `product` is
    only meaningful on create, and both are ignored on update — only
    `color`, `alt_text` and `position` are mutable once a photo exists.
    """

    class Meta:
        model = ProductImage
        fields = ["id", "product", "color", "image", "alt_text", "position"]

    def update(self, instance, validated_data):
        validated_data.pop("image", None)
        validated_data.pop("product", None)
        return super().update(instance, validated_data)


def _price(**kwargs):
    # Matches the shopper-facing serializer's convention (catalog/serializers.py):
    # prices are numbers on the wire, not DRF's default decimal strings.
    return serializers.DecimalField(
        max_digits=10, decimal_places=2, coerce_to_string=False, **kwargs
    )


class ProductAdminListSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    primary_image = serializers.SerializerMethodField()
    price = _price()
    compare_at_price = _price(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name_en",
            "name_ru",
            "name_tg",
            "category",
            "garment",
            "price",
            "compare_at_price",
            "tags",
            "is_active",
            "position",
            "in_stock",
            "primary_image",
            "created_at",
        ]

    def get_primary_image(self, product):
        # `images` is prefetched ordered by position in the viewset's
        # queryset, so this reads the prefetch cache instead of querying.
        images = list(product.images.all())
        if not images:
            return None
        return ProductImageMiniSerializer(images[0], context=self.context).data


class ProductAdminDetailSerializer(serializers.ModelSerializer):
    """Full read/write shape for retrieve, create and update.

    Variants are nested and writable (see `VariantAdminSerializer`); images
    are nested but read-only, since photo management is a separate, upload
    heavy endpoint.
    """

    in_stock = serializers.BooleanField(read_only=True)
    primary_image = serializers.SerializerMethodField()
    variants = VariantAdminSerializer(many=True, required=False)
    images = ProductImageNestedSerializer(many=True, read_only=True)
    price = _price()
    compare_at_price = _price(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name_en",
            "name_ru",
            "name_tg",
            "category",
            "garment",
            "price",
            "compare_at_price",
            "tags",
            "description_en",
            "description_ru",
            "description_tg",
            "details_en",
            "details_ru",
            "details_tg",
            "is_active",
            "position",
            "in_stock",
            "primary_image",
            "created_at",
            "variants",
            "images",
        ]

    def get_primary_image(self, product):
        images = list(product.images.all())
        if not images:
            return None
        return ProductImageMiniSerializer(images[0], context=self.context).data

    def create(self, validated_data):
        variants_data = validated_data.pop("variants", [])
        try:
            with transaction.atomic():
                product = Product.objects.create(**validated_data)
                for variant_data in variants_data:
                    variant_data.pop("id", None)
                    ProductVariant.objects.create(product=product, **variant_data)
        except IntegrityError as exc:
            raise serializers.ValidationError({"variants": [_DUPLICATE_VARIANT_ERROR]}) from exc
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop("variants", None)
        try:
            with transaction.atomic():
                for attr, value in validated_data.items():
                    setattr(instance, attr, value)
                instance.save()

                if variants_data is not None:
                    self._sync_variants(instance, variants_data)
        except IntegrityError as exc:
            raise serializers.ValidationError({"variants": [_DUPLICATE_VARIANT_ERROR]}) from exc
        return instance

    def _sync_variants(self, product, variants_data):
        """Create, update and prune variant rows to match the submitted list.

        Deleting a variant that past orders reference is safe:
        `OrderItem.variant` is `SET_NULL`, so those orders keep their
        snapshot fields untouched.
        """
        submitted_ids = set()
        for variant_data in variants_data:
            variant_id = variant_data.pop("id", None)
            if variant_id is not None:
                submitted_ids.add(variant_id)
                ProductVariant.objects.filter(id=variant_id, product=product).update(**variant_data)
            else:
                created = ProductVariant.objects.create(product=product, **variant_data)
                submitted_ids.add(created.id)

        product.variants.exclude(id__in=submitted_ids).delete()
