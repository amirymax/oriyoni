from django.urls import path

from accounts import views

app_name = "accounts"

urlpatterns = [
    path("csrf/", views.CSRFView.as_view(), name="csrf"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("email/verify/", views.EmailVerifyView.as_view(), name="email-verify"),
    path(
        "email/verify/resend/",
        views.EmailVerificationResendView.as_view(),
        name="email-verify-resend",
    ),
    path("password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "password/reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]
