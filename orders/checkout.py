"""Turning a cart into an order.

This is the one place stock is actually claimed. The cart's own stock check is
advisory — two shoppers can both pass it for the last item — so the rows are
locked here and re-checked inside the transaction before anything is written.
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from catalog.models import ProductVariant
from orders.models import Order, OrderItem


class EmptyCart(serializers.ValidationError):
    def __init__(self):
        super().__init__({"cart": ["Your cart is empty."]})


def place_order(*, cart, email, address, user=None, note=""):
    """Claim stock, record the order, and empty the cart — all or nothing.

    Raises ValidationError naming the lines that could not be fulfilled, so
    the storefront can point at them rather than showing a generic failure.
    """
    with transaction.atomic():
        items = list(cart.items.select_related("variant__product", "variant__color"))
        if not items:
            raise EmptyCart()

        locked = _lock_variants(item.variant_id for item in items)
        _assert_available(items, locked)

        subtotal = sum(
            (locked[item.variant_id].product.price * item.quantity for item in items),
            start=Decimal("0.00"),
        )
        shipping = Order.shipping_for(subtotal)

        order = Order.objects.create(
            user=user,
            email=email,
            subtotal=subtotal,
            shipping=shipping,
            total=subtotal + shipping,
            note=note,
            **address,
        )

        OrderItem.objects.bulk_create(OrderItem.from_cart_item(order, item) for item in items)

        for item in items:
            # F() rather than a read-modify-write: the row is locked, but this
            # also keeps the decrement correct if the lock is ever relaxed.
            ProductVariant.objects.filter(pk=item.variant_id).update(
                stock=F("stock") - item.quantity
            )

        cart.items.all().delete()

    return order


def _lock_variants(variant_ids):
    """Lock the variants being bought, ordered by id to avoid deadlocks.

    `of=("self",)` locks only the variant rows; without it Postgres would also
    lock the joined product and colour rows, which nothing here is changing.
    """
    variants = (
        ProductVariant.objects.select_for_update(of=("self",))
        .select_related("product", "color")
        .filter(pk__in=sorted(set(variant_ids)))
        .order_by("pk")
    )
    return {variant.pk: variant for variant in variants}


def _assert_available(items, locked):
    problems = {}

    for item in items:
        variant = locked.get(item.variant_id)

        if variant is None or not variant.is_active or not variant.product.is_active:
            problems[item.variant.sku] = "is no longer for sale."
        elif variant.stock < item.quantity:
            problems[item.variant.sku] = (
                f"has only {variant.stock} left; you asked for {item.quantity}."
                if variant.stock
                else "sold out while it was in your cart."
            )

    if problems:
        raise serializers.ValidationError(
            {"items": [f"{sku} {reason}" for sku, reason in problems.items()]}
        )
