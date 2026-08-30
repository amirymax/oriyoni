from rest_framework.routers import DefaultRouter

from catalog import admin_views

app_name = "catalog_admin"

router = DefaultRouter()
router.register("categories", admin_views.CategoryAdminViewSet, basename="admin-category")
router.register("colors", admin_views.ColorAdminViewSet, basename="admin-color")
router.register("products", admin_views.ProductAdminViewSet, basename="admin-product")
router.register(
    "product-images", admin_views.ProductImageAdminViewSet, basename="admin-product-image"
)

urlpatterns = router.urls
