"""Saved products.

Unlike the cart, a wishlist needs an account: the whole point is that it
outlives the browser it was made in. Guests keep theirs in localStorage and
push it up when they sign in.
"""

from django.conf import settings
from django.db import models

from catalog.models import Product
from core.models import TimeStampedModel


class WishlistItem(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"], name="one_wishlist_entry_per_product"
            )
        ]

    def __str__(self):
        return f"{self.user} ♥ {self.product}"
