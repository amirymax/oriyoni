from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.session import get_cart
from orders.checkout import EmptyCart, place_order
from orders.models import Order
from orders.notifications import notify_new_order
from orders.serializers import CheckoutSerializer, OrderSerializer


class CheckoutView(APIView):
    """Place an order from the current cart.

    Open to guests: making an account should not be the price of buying
    something. A signed-in shopper gets the order attached to their account so
    it shows up in their history.
    """

    permission_classes = [AllowAny]
    throttle_scope = "checkout"

    def post(self, request):
        cart = get_cart(request)
        if cart is None:
            raise EmptyCart()

        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user and request.user.is_authenticated else None
        order = place_order(
            cart=cart,
            email=serializer.validated_data["email"],
            address=serializer.to_address(),
            user=user,
            note=serializer.validated_data.get("note", ""),
        )

        order = self.with_items(order)
        # After place_order returns, so outside its transaction: a slow
        # notification must not hold locks on the stock rows, and an order that
        # rolled back must never be announced.
        notify_new_order(order, sum(item.quantity for item in order.items.all()))

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def with_items(self, order):
        return Order.objects.with_items().get(pk=order.pk)


class OrderListView(ListAPIView):
    """A shopper's own order history.

    Guest orders have no account to hang off, so they are not listed here —
    the order lands in the checkout response and the confirmation email.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).with_items()


class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "number"

    def get_queryset(self):
        # Scoped to the caller, so another shopper's order number is simply
        # not found rather than forbidden — which would confirm it exists.
        return Order.objects.filter(user=self.request.user).with_items()
