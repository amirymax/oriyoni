from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from accounts.managers import UserManager
from core.models import TimeStampedModel


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """A shopper account, identified by email address.

    There is no username: the storefront asks for an email at signup and
    nothing else, so a separate handle would be a field with no purpose.
    """

    email = models.EmailField(
        "email address",
        unique=True,
        error_messages={"unique": "An account with this email already exists."},
    )
    # Collected at checkout rather than signup, so both stay optional.
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    is_active = models.BooleanField(
        default=True,
        help_text="Unset instead of deleting an account, to keep its order history.",
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Whether the user can sign in to the admin site.",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    # Prompted for by createsuperuser on top of USERNAME_FIELD and password.
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Normalizing here, not just in the manager, keeps the unique index
        # case-insensitive no matter which code path created the row.
        self.email = self.__class__.objects.normalize_email(self.email)
        return super().save(*args, **kwargs)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name
