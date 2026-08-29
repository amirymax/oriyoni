from django.urls import path

from wishlist import views

app_name = "wishlist"

urlpatterns = [
    path("", views.WishlistView.as_view(), name="detail"),
    path("sync/", views.WishlistSyncView.as_view(), name="sync"),
    path("<slug:slug>/", views.WishlistItemView.as_view(), name="item"),
]
