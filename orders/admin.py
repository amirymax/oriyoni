from django.contrib import admin

from orders.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    # Lines are a snapshot of what was agreed. Editing them would rewrite the
    # record of the sale, so they are shown and not touched.
    can_delete = False
    fields = ["sku", "name_en", "color_name_en", "size", "unit_price", "quantity", "line_total"]
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["number", "created_at", "email", "status", "total", "item_count"]
    list_filter = ["status", "created_at"]
    search_fields = ["number", "email", "shipping_name"]
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
    raw_id_fields = ["user"]

    # Only the status is a decision the shop makes after the fact; the rest is
    # what the shopper agreed to.
    readonly_fields = [
        "number",
        "user",
        "email",
        "subtotal",
        "shipping",
        "total",
        "note",
        "created_at",
        "updated_at",
        *[f.name for f in Order._meta.fields if f.name.startswith("shipping_")],
    ]

    fieldsets = [
        (None, {"fields": ["number", "status", "created_at", "updated_at"]}),
        ("Customer", {"fields": ["user", "email"]}),
        (
            "Shipping to",
            {
                "fields": [
                    "shipping_name",
                    "shipping_line1",
                    "shipping_line2",
                    "shipping_city",
                    "shipping_postal_code",
                    "shipping_country",
                    "shipping_phone",
                ]
            },
        ),
        ("Totals", {"fields": ["subtotal", "shipping", "total"]}),
        ("Note", {"fields": ["note"]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("items")

    def has_add_permission(self, request):
        # Orders come from checkout, not from the admin.
        return False

    @admin.display(description="Items")
    def item_count(self, order):
        return order.item_count
