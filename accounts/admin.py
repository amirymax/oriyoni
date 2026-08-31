from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm

from accounts.forms import UserChangeForm, UserCreationForm
from accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Django's UserAdmin, retargeted from username to email."""

    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = [
        "email",
        "first_name",
        "last_name",
        "email_confirmed",
        "is_staff",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_staff", "is_superuser", "is_active", "email_verified_at"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at", "last_login"]

    fieldsets = [
        (None, {"fields": ["email", "password"]}),
        ("Personal info", {"fields": ["first_name", "last_name"]}),
        (
            "Permissions",
            {
                "fields": [
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ]
            },
        ),
        # Editable, so support can confirm an address by hand for a shopper
        # whose mail provider is eating the link.
        ("Email", {"fields": ["email_verified_at"]}),
        ("Dates", {"fields": ["last_login", "created_at", "updated_at"]}),
    ]

    @admin.display(boolean=True, description="Email confirmed", ordering="email_verified_at")
    def email_confirmed(self, user):
        return user.email_verified

    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": ["email", "usable_password", "password1", "password2"],
            },
        ),
    ]
