"""Orders.

An order is a record of what was agreed, so every line copies the name, price
and options as they stood at checkout. Renaming a product or repricing it
later must not rewrite history, and deleting one must not blank out an order
someone already paid for.
"""

import secrets
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from catalog.models import ProductVariant
from core.models import TimeStampedModel

# Matches the storefront's promise of free shipping over 120 ₽.
FREE_SHIPPING_THRESHOLD = Decimal("120.00")
SHIPPING_FLAT_RATE = Decimal("12.00")

# Unambiguous in print and on the phone: no O/0 or I/1.
NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_order_number():
    """A dated, non-sequential reference.

    Sequential numbers tell anyone who places an order how many the shop has
    taken, and let them guess their neighbours'. The random tail avoids both.
    """
    stamp = timezone.now().strftime("%Y%m%d")
    tail = "".join(secrets.choice(NUMBER_ALPHABET) for _ in range(6))
    return f"ORI-{stamp}-{tail}"


class OrderStatus(models.TextChoices):
    # Payments are not connected yet, so every order lands here and is moved
    # on from the admin.
    PENDING = "pending", "Pending payment"
    PAID = "paid", "Paid"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


class OrderQuerySet(models.QuerySet):
    def with_items(self):
        """Preload the lines and the photo each one draws.

        The photo is read through the variant, so the chain has to come with
        it — otherwise an order with ten lines costs ten queries to render.
        """
        return self.prefetch_related("items__variant__product__images")


class Order(TimeStampedModel):
    number = models.CharField(max_length=32, unique=True, default=generate_order_number)

    # Null for a guest checkout, and kept if the account is later closed —
    # the order still has to exist for accounting.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    email = models.EmailField(help_text="Where the confirmation goes.")

    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )

    # Totals are stored rather than recomputed: shipping rules and prices
    # change, and an old order must still add up to what was charged.
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    shipping_name = models.CharField(max_length=200)
    shipping_line1 = models.CharField("address line 1", max_length=200)
    shipping_line2 = models.CharField("address line 2", max_length=200, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=32)
    shipping_country = models.CharField(max_length=2, help_text="ISO 3166-1 alpha-2.")
    shipping_phone = models.CharField(max_length=32, blank=True)

    note = models.TextField(blank=True, help_text="Anything the shopper asked for.")

    objects = OrderQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return self.number

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())

    @staticmethod
    def shipping_for(subtotal):
        if subtotal >= FREE_SHIPPING_THRESHOLD:
            return Decimal("0.00")
        return SHIPPING_FLAT_RATE


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")

    # Kept for stock reporting, but nothing on the line depends on it: the
    # variant may be discontinued and deleted long before the order is
    # archived, and the snapshot below still reads correctly.
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        related_name="order_items",
        null=True,
        blank=True,
    )

    sku = models.CharField(max_length=64)
    product_slug = models.SlugField()
    name_en = models.CharField(max_length=200)
    name_ru = models.CharField(max_length=200)
    name_tg = models.CharField(max_length=200)
    color_name_en = models.CharField(max_length=60)
    color_name_ru = models.CharField(max_length=60)
    color_name_tg = models.CharField(max_length=60)
    size = models.CharField(max_length=20)

    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveSmallIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} × {self.name_en}"

    @classmethod
    def from_cart_item(cls, order, cart_item):
        variant = cart_item.variant
        product = variant.product
        unit_price = product.price

        return cls(
            order=order,
            variant=variant,
            sku=variant.sku,
            product_slug=product.slug,
            name_en=product.name_en,
            name_ru=product.name_ru,
            name_tg=product.name_tg,
            color_name_en=variant.color.name_en,
            color_name_ru=variant.color.name_ru,
            color_name_tg=variant.color.name_tg,
            size=variant.size,
            unit_price=unit_price,
            quantity=cart_item.quantity,
            line_total=unit_price * cart_item.quantity,
        )
