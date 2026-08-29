from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """Creates users keyed by email address rather than a username."""

    use_in_migrations = True

    def normalize_email(self, email):
        """Lowercase the whole address, not just the domain.

        Django's implementation leaves the local part alone, which is
        RFC-correct but means Ada@… and ada@… are two accounts. Shoppers do
        not expect that, so the address is stored fully lowercased and the
        unique constraint rejects the duplicate. accounts.backends.EmailBackend
        normalizes lookups the same way so login stays case-insensitive.
        """
        return super().normalize_email(email).lower()

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")

        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.full_clean(exclude=["password"], validate_unique=False)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusers must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusers must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)
