from django.contrib import admin
from django.utils.html import format_html

from catalog.models import Category, Color, Product, ProductVariant


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name_en", "name_ru", "name_tg", "slug", "position"]
    list_editable = ["position"]
    prepopulated_fields = {"slug": ["name_en"]}


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ["swatch", "name_en", "name_ru", "name_tg", "slug", "hex", "is_dark"]
    prepopulated_fields = {"slug": ["name_en"]}

    @admin.display(description="")
    def swatch(self, color):
        return format_html(
            '<span style="display:inline-block;width:18px;height:18px;'
            'border:1px solid #999;background:{}"></span>',
            color.hex,
        )


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ["color", "size", "sku", "stock", "is_active"]
    # Without this the inline runs a query per row to render the colour select.
    autocomplete_fields = []


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name_en", "category", "price", "compare_at_price", "stock_total", "is_active"]
    list_filter = ["category", "garment", "is_active"]
    search_fields = ["name_en", "name_ru", "name_tg", "slug"]
    list_editable = ["is_active"]
    prepopulated_fields = {"slug": ["name_en"]}
    inlines = [ProductVariantInline]

    fieldsets = [
        (None, {"fields": ["slug", "category", "garment", "is_active", "position"]}),
        ("Names", {"fields": ["name_en", "name_ru", "name_tg"]}),
        ("Pricing", {"fields": ["price", "compare_at_price", "tags"]}),
        (
            "Copy",
            {
                "fields": [
                    "description_en",
                    "description_ru",
                    "description_tg",
                    "details_en",
                    "details_ru",
                    "details_tg",
                ]
            },
        ),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("category").prefetch_related("variants")

    @admin.display(description="In stock")
    def stock_total(self, product):
        return sum(variant.stock for variant in product.variants.all())


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ["sku", "product", "color", "size", "stock", "is_active"]
    list_filter = ["is_active", "color", "product__category"]
    search_fields = ["sku", "product__name_en"]
    list_editable = ["stock", "is_active"]
    list_select_related = ["product", "color"]
