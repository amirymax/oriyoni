from django.contrib import admin

from wishlist.models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    """Read-mostly: useful for seeing what people want but cannot buy yet."""

    list_display = ["product", "user", "created_at"]
    list_filter = ["created_at", "product__category"]
    search_fields = ["user__email", "product__name_en"]
    list_select_related = ["user", "product"]
    raw_id_fields = ["user", "product"]
