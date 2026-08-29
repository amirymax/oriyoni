from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import MAX_QUANTITY_PER_LINE, Cart, CartItem
from cart.serializers import AddItemSerializer, CartSerializer, UpdateItemSerializer
from cart.session import get_cart, set_cart_cookie


def check_stock(variant, wanted):
    """Refuse a line the shop cannot fulfil.

    This is a courtesy check against the count as it stands now — two shoppers
    can still pass it for the last item. Checkout is where stock is claimed
    under a lock; here the point is to tell someone before they reach it.
    """
    if wanted > MAX_QUANTITY_PER_LINE:
        raise serializers.ValidationError(
            {"quantity": [f"You can order at most {MAX_QUANTITY_PER_LINE} of one item."]}
        )

    if wanted > variant.stock:
        message = (
            f"Only {variant.stock} left in that size and colour."
            if variant.stock
            else "That size and colour is sold out."
        )
        raise serializers.ValidationError({"quantity": [message]})


class CartViewMixin:
    """Shared plumbing: anyone may hold a cart, signed in or not."""

    permission_classes = [AllowAny]

    def cart_response(self, cart, status_code=status.HTTP_200_OK):
        if cart is None:
            return Response(CartSerializer.empty(), status=status_code)

        loaded = Cart.objects.prefetch_related(
            "items__variant__product", "items__variant__color"
        ).get(pk=cart.pk)

        response = Response(CartSerializer(loaded).data, status=status_code)
        return set_cart_cookie(response, loaded)

    def get_own_item(self, request, pk):
        """Look the line up inside the caller's own cart.

        Scoping the lookup rather than filtering afterwards means someone
        else's line id is simply not found, never touched.
        """
        cart = get_cart(request)
        if cart is None:
            raise Http404("No cart.")

        item = get_object_or_404(CartItem.objects.select_related("variant"), pk=pk, cart=cart)
        return cart, item


class CartView(CartViewMixin, APIView):
    def get(self, request):
        return self.cart_response(get_cart(request))

    def delete(self, request):
        """Empty the cart without discarding it."""
        cart = get_cart(request)
        if cart is not None:
            cart.items.all().delete()
        return self.cart_response(cart)


class CartItemsView(CartViewMixin, APIView):
    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        variant = serializer.validated_data["sku"]
        quantity = serializer.validated_data["quantity"]

        with transaction.atomic():
            cart = get_cart(request, create=True)
            item = CartItem.objects.filter(cart=cart, variant=variant).first()

            # Adding the same variant twice tops the line up rather than
            # starting a second one, which is what a shopper expects. The
            # total is checked before anything is written, so a rejected add
            # leaves the cart exactly as it was.
            wanted = (item.quantity if item else 0) + quantity
            check_stock(variant, wanted)

            created = item is None
            if created:
                CartItem.objects.create(cart=cart, variant=variant, quantity=wanted)
            else:
                item.quantity = wanted
                item.save(update_fields=["quantity", "updated_at"])

        return self.cart_response(cart, status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartItemView(CartViewMixin, APIView):
    def patch(self, request, pk):
        cart, item = self.get_own_item(request, pk)

        serializer = UpdateItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]

        if quantity == 0:
            # Stepping a line down to zero is how the storefront removes it.
            item.delete()
            return self.cart_response(cart)

        check_stock(item.variant, quantity)
        item.quantity = quantity
        item.save(update_fields=["quantity", "updated_at"])
        return self.cart_response(cart)

    def delete(self, request, pk):
        cart, item = self.get_own_item(request, pk)
        item.delete()
        return self.cart_response(cart)
