"""Server-side carts.

A cart belongs either to an account or to an anonymous visitor identified by
an opaque token in a cookie. Keeping guest carts server-side is what lets the
contents survive a login: the guest cart is merged into the account's on the
way in, so nothing is lost by signing in mid-shop.
"""

import uuid

from django.conf import settings
from django.db import models

from catalog.models import ProductVariant
from core.models import TimeStampedModel

# What a shopper may put on one line. Stock caps it lower in practice; this is
# a guard against a client sending an absurd number.
MAX_QUANTITY_PER_LINE = 99


class Cart(TimeStampedModel):
    # Exactly one of these is set. A cart starts anonymous and gains an owner
    # when its visitor signs in.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
        null=True,
        blank=True,
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(user__isnull=False) | models.Q(token__isnull=False),
                name="cart_has_an_owner_or_a_token",
            )
        ]

    def __str__(self):
        return f"Cart for {self.user}" if self.user_id else f"Guest cart {self.token}"

    @property
    def count(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum((item.line_total for item in self.items.all()), start=0)

    def merge_from(self, other):
        """Absorb another cart's lines, then delete it.

        Quantities add up rather than overwrite — a visitor who put two tees in
        before signing in and already had one saved means three. Stock still
        caps the result, so merging can never create an unfulfillable line.
        """
        if other.pk == self.pk:
            return self

        mine = {item.variant_id: item for item in self.items.all()}

        for incoming in other.items.select_related("variant"):
            existing = mine.get(incoming.variant_id)
            if existing is None:
                incoming.cart = self
                incoming.quantity = min(incoming.quantity, incoming.variant.stock)
                if incoming.quantity:
                    incoming.save(update_fields=["cart", "quantity", "updated_at"])
                continue

            existing.quantity = min(
                existing.quantity + incoming.quantity,
                incoming.variant.stock,
                MAX_QUANTITY_PER_LINE,
            )
            existing.save(update_fields=["quantity", "updated_at"])

        other.delete()
        return self


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["created_at", "id"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "variant"], name="one_line_per_variant"),
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="quantity_is_positive"),
        ]

    def __str__(self):
        return f"{self.quantity} × {self.variant}"

    @property
    def unit_price(self):
        # Read live from the catalogue: a cart is a wish, not a contract. The
        # price is only frozen when the order is placed.
        return self.variant.product.price

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    @property
    def available(self):
        return self.variant.stock if self.variant.is_active else 0
