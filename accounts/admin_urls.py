from rest_framework.routers import DefaultRouter

from accounts import admin_views

app_name = "accounts_admin"

router = DefaultRouter()
router.register("users", admin_views.UserAdminViewSet, basename="admin-user")

urlpatterns = router.urls
