from django.urls import path

from engagement import views

app_name = "engagement"

urlpatterns = [
    path("newsletter/", views.SubscribeView.as_view(), name="subscribe"),
    path("newsletter/unsubscribe/", views.UnsubscribeView.as_view(), name="unsubscribe"),
    path("contact/", views.ContactView.as_view(), name="contact"),
]
