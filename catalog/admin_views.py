"""Admin-panel viewsets for the catalogue.

Everything here is staff-only (`IsAdminUser` — DRF's built-in class already
checks `request.user.is_staff`) and mounted under `/api/admin/` in
`config/urls.py`. The shopper-facing catalogue in `catalog/views.py` is
untouched.
"""

from django.db.models import Count, Prefetch, ProtectedError
from rest_framework import filters, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from catalog.admin_serializers import (
    CategoryAdminSerializer,
    ColorAdminSerializer,
    ProductAdminDetailSerializer,
    ProductAdminListSerializer,
    ProductImageAdminSerializer,
)
from catalog.models import Category, Color, Product, ProductImage


class CategoryAdminViewSet(viewsets.ModelViewSet):
    serializer_class = CategoryAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["slug", "name_en", "name_ru"]

    def get_queryset(self):
        # Explicit despite Category.Meta.ordering already matching: pagination
        # warns about an "unordered" queryset once annotate() is involved.
        return Category.objects.annotate(product_count=Count("products")).order_by(
            "position", "slug"
        )

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Нельзя удалить категорию, в которой ещё есть товары."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ColorAdminViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["slug", "name_en", "name_ru"]


class ProductAdminViewSet(viewsets.ModelViewSet):
    """Full CRUD over the catalogue, with nested variant management.

    Filters are hand-rolled for the same reason as the shopper-facing
    `ProductViewSet`: there are a handful of them and pulling in
    django-filter for four query params would not pay for itself.
    """

    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["slug", "name_en", "name_ru"]
    ordering_fields = ["position", "slug", "created_at"]
    ordering = ["position", "slug"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductAdminListSerializer
        return ProductAdminDetailSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related("category").prefetch_related(
            "variants__color",
            Prefetch("images", queryset=ProductImage.objects.order_by("position", "id")),
        )
        params = self.request.query_params

        if category := params.get("category"):
            if category.isdigit():
                queryset = queryset.filter(category_id=category)
            else:
                queryset = queryset.filter(category__slug=category)

        if (is_active := params.get("is_active")) is not None:
            if is_active.lower() in {"true", "1"}:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in {"false", "0"}:
                queryset = queryset.filter(is_active=False)

        if garment := params.get("garment"):
            queryset = queryset.filter(garment=garment)

        return queryset


class ProductImageAdminViewSet(viewsets.ModelViewSet):
    """Photo upload, reorder and delete for a product's gallery."""

    serializer_class = ProductImageAdminSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = ProductImage.objects.select_related("product", "color")
        if product := self.request.query_params.get("product"):
            queryset = queryset.filter(product_id=product)
        return queryset

    def perform_destroy(self, instance):
        # Otherwise the row disappears but the file sits on disk forever.
        instance.image.delete(save=False)
        instance.delete()
