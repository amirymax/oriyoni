"""Cross-app aggregation for the admin panel.

Lives in its own app rather than `catalog` or `orders` to avoid either one
importing the other just to build a dashboard number — `Order`, `Product`
and `ProductVariant` are read here, never written.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product, ProductVariant
from orders.models import Order, OrderItem, OrderStatus

REVENUE_STATUSES = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
LOW_STOCK_THRESHOLD = 5

User = get_user_model()


class AdminDashboardView(APIView):
    """Headline numbers for the admin panel's landing page."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.isoweekday() - 1)

        revenue_total = (
            Order.objects.filter(status__in=REVENUE_STATUSES).aggregate(total=Sum("total"))["total"]
            or 0
        )

        recent_orders = Order.objects.order_by("-created_at")[:10]

        return Response(
            {
                "revenue_total": revenue_total,
                "orders_today": Order.objects.filter(created_at__date=today).count(),
                "orders_this_week": Order.objects.filter(created_at__date__gte=week_start).count(),
                "orders_pending": Order.objects.filter(status=OrderStatus.PENDING).count(),
                "low_stock_variants": ProductVariant.objects.filter(
                    is_active=True, stock__lte=LOW_STOCK_THRESHOLD
                ).count(),
                "active_products": Product.objects.filter(is_active=True).count(),
                "total_users": User.objects.count(),
                "recent_orders": [
                    {
                        "id": order.id,
                        "number": order.number,
                        "email": order.email,
                        "status": order.status,
                        "total": order.total,
                        "created_at": order.created_at,
                    }
                    for order in recent_orders
                ],
            }
        )


TRUNC_BY_GRANULARITY = {"day": TruncDay, "week": TruncWeek, "month": TruncMonth}


class AdminAnalyticsView(APIView):
    """Business/sales analytics, derived entirely from `Order`/`Product` data.

    There is no visitor or traffic tracking to draw on — nothing instruments
    that today — so everything here comes from orders that were actually
    placed.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        params = request.query_params
        today = timezone.now().date()

        date_to = parse_date(params.get("date_to", "")) or today
        date_from = parse_date(params.get("date_from", "")) or (date_to - timedelta(days=30))
        granularity = params.get("granularity", "day")
        trunc = TRUNC_BY_GRANULARITY.get(granularity, TruncDay)

        all_orders_in_range = Order.objects.filter(
            created_at__date__gte=date_from, created_at__date__lte=date_to
        )
        revenue_orders = all_orders_in_range.filter(status__in=REVENUE_STATUSES)

        revenue_series = list(
            revenue_orders.annotate(period=trunc("created_at"))
            .values("period")
            .annotate(revenue=Sum("total"), orders=Count("id"))
            .order_by("period")
        )

        order_items = OrderItem.objects.filter(order__in=revenue_orders)

        top_products = list(
            order_items.values("product_slug", "name_en")
            .annotate(quantity=Sum("quantity"), revenue=Sum("line_total"))
            .order_by("-revenue")[:10]
        )

        category_performance = self._category_performance(order_items)

        status_breakdown = list(
            all_orders_in_range.values("status").annotate(count=Count("id")).order_by("-count")
        )

        order_count = all_orders_in_range.count()
        revenue_total = revenue_orders.aggregate(total=Sum("total"))["total"] or 0
        revenue_order_count = revenue_orders.count()
        average_order_value = revenue_total / revenue_order_count if revenue_order_count else 0

        return Response(
            {
                "date_from": date_from,
                "date_to": date_to,
                "revenue_series": [
                    {
                        "period": row["period"].date() if row["period"] else None,
                        "revenue": row["revenue"] or 0,
                        "orders": row["orders"],
                    }
                    for row in revenue_series
                ],
                "top_products": [
                    {
                        "product_slug": row["product_slug"],
                        "name_en": row["name_en"],
                        "quantity": row["quantity"],
                        "revenue": row["revenue"] or 0,
                    }
                    for row in top_products
                ],
                "category_performance": category_performance,
                "status_breakdown": [
                    {"status": row["status"], "count": row["count"]} for row in status_breakdown
                ],
                "average_order_value": average_order_value,
                "order_count": order_count,
            }
        )

    def _category_performance(self, order_items):
        """Fold per-product totals into per-category totals.

        `OrderItem` has no FK to `Category` — only the denormalized
        `product_slug` — so the join happens here in Python: aggregate by
        slug, look up each slug's current category, then sum into buckets. A
        slug that no longer matches any product (e.g. it was deleted) is
        bucketed as "unknown" rather than dropped or crashing.
        """
        per_product = order_items.values("product_slug").annotate(
            quantity=Sum("quantity"), revenue=Sum("line_total")
        )

        slugs = [row["product_slug"] for row in per_product]
        category_by_slug = {
            row["slug"]: (row["category__slug"], row["category__name_en"])
            for row in Product.objects.filter(slug__in=slugs)
            .select_related("category")
            .values("slug", "category__slug", "category__name_en")
        }

        buckets = {}
        for row in per_product:
            category_slug, category_name = category_by_slug.get(
                row["product_slug"], (None, "Unknown")
            )
            key = category_slug or "unknown"
            bucket = buckets.setdefault(
                key,
                {
                    "category_slug": key,
                    "name_en": category_name or "Unknown",
                    "quantity": 0,
                    "revenue": 0,
                },
            )
            bucket["quantity"] += row["quantity"]
            bucket["revenue"] += row["revenue"] or 0

        return sorted(buckets.values(), key=lambda b: b["revenue"], reverse=True)
