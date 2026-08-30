"""The product catalogue.

Bilingual text is stored as paired `_en`/`_ru` columns rather than through a
translation package. The storefront needs both languages in one payload —
it switches language without a round trip — so there is nothing to gain from
locale negotiation, and the serializers fold each pair back into the
`{"en": …, "ru": …}` shape the frontend already types as `Localized<T>`.
"""

from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models

from core.models import TimeStampedModel

HEX_COLOR = RegexValidator(
    r"^#[0-9a-fA-F]{6}$",
    "Enter a six-digit hex colour, for example #0a0a0a.",
)

# Sizes are free text on the variant rather than a table: the set differs by
# garment, and "One Size" is a real value for accessories.
ONE_SIZE = "One Size"


class Garment(models.TextChoices):
    TEE = "tee", "Tee"
    HOODIE = "hoodie", "Hoodie"
    CAP = "cap", "Cap"
    BEANIE = "beanie", "Beanie"
    TOTE = "tote", "Tote"


class Tag(models.TextChoices):
    NEW = "new", "New"
    SALE = "sale", "Sale"
    BESTSELLER = "bestseller", "Bestseller"


class Category(TimeStampedModel):
    slug = models.SlugField(unique=True)
    name_en = models.CharField(max_length=100)
    name_ru = models.CharField(max_length=100)
    position = models.PositiveSmallIntegerField(
        default=0,
        help_text="Lower numbers come first in navigation.",
    )

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["position", "slug"]

    def __str__(self):
        return self.name_en


class Color(TimeStampedModel):
    # The slug doubles as the cart line key the storefront already persists,
    # so it must stay stable even when the display name is retranslated.
    slug = models.SlugField(unique=True)
    name_en = models.CharField(max_length=60)
    name_ru = models.CharField(max_length=60)
    hex = models.CharField(max_length=7, validators=[HEX_COLOR])
    is_dark = models.BooleanField(
        default=False,
        help_text="Whether the swatch needs light text or a lighter border.",
    )

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.name_en


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_related(self):
        """Preload everything the list and detail serializers touch."""
        return self.select_related("category").prefetch_related("variants__color")


class Product(TimeStampedModel):
    slug = models.SlugField(unique=True)
    name_en = models.CharField(max_length=200)
    name_ru = models.CharField(max_length=200)

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    garment = models.CharField(max_length=20, choices=Garment.choices)

    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="The struck-through price. Leave empty when not on sale.",
    )

    # Editorial rather than derived: "sale" usually tracks compare_at_price,
    # but "new" and "bestseller" are merchandising decisions.
    tags = ArrayField(
        models.CharField(max_length=20, choices=Tag.choices),
        default=list,
        blank=True,
    )

    description_en = models.TextField()
    description_ru = models.TextField()
    details_en = ArrayField(models.CharField(max_length=200), default=list, blank=True)
    details_ru = ArrayField(models.CharField(max_length=200), default=list, blank=True)

    is_active = models.BooleanField(
        default=True,
        help_text="Unset to hide from the storefront without deleting order history.",
    )
    position = models.PositiveSmallIntegerField(default=0)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["position", "slug"]
        indexes = [models.Index(fields=["is_active", "position"])]

    def __str__(self):
        return self.name_en

    @property
    def is_on_sale(self):
        return self.compare_at_price is not None and self.compare_at_price > self.price

    @property
    def in_stock(self):
        return any(variant.in_stock for variant in self.variants.all())


class ProductVariant(TimeStampedModel):
    """One buyable combination: a product in a colour and a size.

    Stock lives here rather than on the product because that is the level a
    shopper actually picks, and the level that runs out.
    """

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    color = models.ForeignKey(Color, on_delete=models.PROTECT, related_name="variants")
    size = models.CharField(max_length=20)

    sku = models.CharField(max_length=64, unique=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["product", "color__slug", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "color", "size"],
                name="unique_variant_per_product_color_size",
            )
        ]

    def __str__(self):
        return f"{self.product.name_en} — {self.color.name_en} / {self.size}"

    @property
    def in_stock(self):
        return self.is_active and self.stock > 0


class ProductImage(TimeStampedModel):
    """A photo attached to a product, optionally tagged to one colourway.

    Managed from the admin panel, replacing the storefront's placeholder
    garment mockups on products that have real photography.
    """

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    color = models.ForeignKey(
        Color, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=200, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f"{self.product.name_en} — image {self.pk}"
