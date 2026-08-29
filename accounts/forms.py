"""Admin forms bound to the email-keyed user model.

Django's stock auth forms target django.contrib.auth.User and declare a
`username` field class, so they need rebinding before the admin can use them.
"""

from django.contrib.auth import forms as auth_forms

from accounts.models import User


class UserCreationForm(auth_forms.AdminUserCreationForm):
    """The admin's "add user" form.

    Subclasses AdminUserCreationForm rather than UserCreationForm because only
    the former carries the `usable_password` toggle the admin's add view
    renders.
    """

    class Meta(auth_forms.AdminUserCreationForm.Meta):
        model = User
        fields = ("email",)
        field_classes = {}


class UserChangeForm(auth_forms.UserChangeForm):
    """The admin's "edit user" form, with its read-only password hash field."""

    class Meta(auth_forms.UserChangeForm.Meta):
        model = User
        fields = "__all__"
        field_classes = {}
