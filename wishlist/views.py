from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from catalog.serializers import ProductSerializer
from wishlist.models import WishlistItem


class SlugSerializer(serializers.Serializer):
    slug = serializers.SlugField()


class SyncSerializer(serializers.Serializer):
    # Capped so a hostile client cannot post an unbounded list.
    slugs = serializers.ListField(child=serializers.SlugField(), max_length=200)


def saved_products(user):
    return (
        Product.objects.active()
        .with_related()
        .filter(wishlisted_by__user=user)
        .order_by("-wishlisted_by__created_at")
    )


class WishlistView(APIView):
    """The signed-in shopper's saved products.

    Answers with the full product list rather than slugs, so the wishlist page
    renders from one call.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProductSerializer(saved_products(request.user), many=True).data)

    def post(self, request):
        serializer = SlugSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = Product.objects.active().filter(slug=serializer.validated_data["slug"]).first()
        if product is None:
            raise serializers.ValidationError({"slug": ["No such product."]})

        # Saving twice is not an error — the storefront's heart is a toggle and
        # a double tap should leave it saved, not blow up.
        WishlistItem.objects.get_or_create(user=request.user, product=product)

        return Response(
            ProductSerializer(saved_products(request.user), many=True).data,
            status=status.HTTP_201_CREATED,
        )


class WishlistItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug):
        WishlistItem.objects.filter(user=request.user, product__slug=slug).delete()
        # Removing something that was not there still leaves it not there.
        return Response(ProductSerializer(saved_products(request.user), many=True).data)


class WishlistSyncView(APIView):
    """Fold a guest's locally saved slugs into the account.

    Called once after signing in. Adding rather than replacing: what was saved
    on another device should not be wiped by whatever this browser happened to
    be holding.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        products = Product.objects.active().filter(slug__in=serializer.validated_data["slugs"])
        WishlistItem.objects.bulk_create(
            [WishlistItem(user=request.user, product=product) for product in products],
            # Slugs already saved are skipped rather than colliding.
            ignore_conflicts=True,
        )

        return Response(ProductSerializer(saved_products(request.user), many=True).data)
