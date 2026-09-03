from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from catalog.models import Category, Product
from catalog.serializers import CategorySerializer, ProductDetailSerializer, ProductSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = "slug"
    pagination_class = None


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """The public catalogue.

    Filters are hand-rolled rather than pulled in from django-filter: there
    are four of them and they are unlikely to multiply.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.active().with_related()
        params = self.request.query_params

        if category := params.get("category"):
            queryset = queryset.filter(category__slug=category)

        if tag := params.get("tag"):
            queryset = queryset.filter(tags__contains=[tag])

        if params.get("on_sale") in {"true", "1"}:
            queryset = queryset.filter(compare_at_price__gt=0)

        if search := params.get("search"):
            # Every language at once, because the visitor may be reading in
            # any of them and product names are not translated word for word.
            queryset = queryset.filter(
                Q(name_en__icontains=search)
                | Q(name_ru__icontains=search)
                | Q(name_tg__icontains=search)
                | Q(description_en__icontains=search)
                | Q(description_ru__icontains=search)
                | Q(description_tg__icontains=search)
            )

        ordering = params.get("ordering")
        allowed = {"price", "-price", "name_en", "-name_en", "position", "-position"}
        if ordering in allowed:
            queryset = queryset.order_by(ordering)

        return queryset
