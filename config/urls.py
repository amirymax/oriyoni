from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("catalog.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/wishlist/", include("wishlist.urls")),
    path("api/", include("engagement.urls")),
    # The new admin panel's staff-only API, one include per app, all mounted
    # under the same prefix — mirrors how the shopper-facing routers above
    # are wired, just gated by IsAdminUser instead of AllowAny.
    path("api/admin/", include("catalog.admin_urls")),
    path("api/admin/", include("orders.admin_urls")),
    path("api/admin/", include("accounts.admin_urls")),
    path("api/admin/", include("dashboard.urls")),
]

if settings.DEBUG:
    # Uploaded product photos live on local disk in development. In
    # production this is served by whatever sits in front of gunicorn, with
    # MEDIA_ROOT persisted via a volume — see the note in docker-compose.yml.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
