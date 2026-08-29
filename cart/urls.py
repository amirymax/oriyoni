from django.urls import path

from cart import views

app_name = "cart"

urlpatterns = [
    path("", views.CartView.as_view(), name="detail"),
    path("items/", views.CartItemsView.as_view(), name="items"),
    path("items/<int:pk>/", views.CartItemView.as_view(), name="item"),
]
