from django.contrib import admin

from cart.models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ["variant", "quantity"]
    raw_id_fields = ["variant"]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Read-mostly: useful for answering "what did they have in the basket?"."""

    list_display = ["__str__", "owner", "line_count", "updated_at"]
    list_filter = ["created_at"]
    search_fields = ["user__email", "token"]
    readonly_fields = ["token", "created_at", "updated_at"]
    raw_id_fields = ["user"]
    inlines = [CartItemInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("items")

    @admin.display(description="Owner")
    def owner(self, cart):
        return cart.user.email if cart.user_id else "guest"

    @admin.display(description="Lines")
    def line_count(self, cart):
        return len(cart.items.all())
