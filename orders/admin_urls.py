from rest_framework.routers import DefaultRouter

from orders import admin_views

app_name = "orders_admin"

router = DefaultRouter()
router.register("orders", admin_views.OrderAdminViewSet, basename="admin-order")

urlpatterns = router.urls
