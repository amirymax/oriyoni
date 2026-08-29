from rest_framework.routers import DefaultRouter

from catalog import views

app_name = "catalog"

router = DefaultRouter()
router.register("products", views.ProductViewSet, basename="product")
router.register("categories", views.CategoryViewSet, basename="category")

urlpatterns = router.urls
