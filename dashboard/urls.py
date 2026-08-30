from django.urls import path

from dashboard import views

app_name = "dashboard"

urlpatterns = [
    path("dashboard/", views.AdminDashboardView.as_view(), name="dashboard"),
    path("analytics/", views.AdminAnalyticsView.as_view(), name="analytics"),
]
