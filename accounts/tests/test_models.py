import pytest
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestCreateUser:
    def test_creates_an_active_non_staff_shopper(self):
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert user.email == "ada@example.com"
        assert user.check_password("correct-horse-battery")
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser

    def test_password_is_hashed_not_stored(self):
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert user.password != "correct-horse-battery"
        assert user.password.startswith("pbkdf2_")

    def test_email_is_lowercased_in_full(self):
        """Both the local part and the domain, unlike Django's default."""
        user = User.objects.create_user("Ada.Lovelace@Example.COM", "correct-horse-battery")

        assert user.email == "ada.lovelace@example.com"

    def test_email_is_required(self):
        with pytest.raises(ValueError, match="email address"):
            User.objects.create_user("", "correct-horse-battery")

    def test_malformed_email_is_rejected(self):
        with pytest.raises(ValidationError):
            User.objects.create_user("not-an-email", "correct-horse-battery")

    def test_names_default_to_blank(self):
        """Signup asks for an email only; names arrive at checkout."""
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert user.first_name == ""
        assert user.last_name == ""


class TestUniqueness:
    def test_duplicate_email_is_rejected(self):
        User.objects.create_user("ada@example.com", "correct-horse-battery")

        with pytest.raises(IntegrityError):
            User.objects.create_user("ada@example.com", "another-password")

    def test_duplicate_differing_only_in_case_is_rejected(self):
        User.objects.create_user("ada@example.com", "correct-horse-battery")

        with pytest.raises(IntegrityError):
            User.objects.create_user("ADA@EXAMPLE.COM", "another-password")

    def test_normalization_applies_outside_the_manager(self):
        """Saving the model directly must normalize too, or the index leaks."""
        user = User(email="Direct@Example.com")
        user.set_password("correct-horse-battery")
        user.save()

        assert User.objects.get(pk=user.pk).email == "direct@example.com"


class TestCreateSuperuser:
    def test_creates_staff_and_superuser(self):
        user = User.objects.create_superuser("root@example.com", "correct-horse-battery")

        assert user.is_staff
        assert user.is_superuser
        assert user.is_active

    def test_rejects_non_staff(self):
        with pytest.raises(ValueError, match="is_staff=True"):
            User.objects.create_superuser(
                "root@example.com", "correct-horse-battery", is_staff=False
            )

    def test_rejects_non_superuser(self):
        with pytest.raises(ValueError, match="is_superuser=True"):
            User.objects.create_superuser(
                "root@example.com", "correct-horse-battery", is_superuser=False
            )


class TestAuthentication:
    def test_authenticates_by_email(self):
        User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert authenticate(username="ada@example.com", password="correct-horse-battery")

    def test_authentication_is_case_insensitive(self):
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert (
            authenticate(username="  ADA@Example.COM  ", password="correct-horse-battery") == user
        )

    def test_unknown_email_does_not_authenticate(self):
        assert authenticate(username="nobody@example.com", password="correct-horse-battery") is None

    def test_wrong_password_does_not_authenticate(self):
        User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert authenticate(username="ada@example.com", password="wrong") is None

    def test_inactive_user_does_not_authenticate(self):
        User.objects.create_user("ada@example.com", "correct-horse-battery", is_active=False)

        assert authenticate(username="ada@example.com", password="correct-horse-battery") is None


class TestRepresentation:
    def test_str_is_the_email(self):
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert str(user) == "ada@example.com"

    def test_full_name_joins_the_parts(self):
        user = User.objects.create_user(
            "ada@example.com", "correct-horse-battery", first_name="Ada", last_name="Lovelace"
        )

        assert user.get_full_name() == "Ada Lovelace"
        assert user.get_short_name() == "Ada"

    def test_full_name_is_blank_when_names_are_unset(self):
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert user.get_full_name() == ""


class TestModelConfiguration:
    def test_logs_in_with_email_and_has_no_username(self):
        assert User.USERNAME_FIELD == "email"
        assert User.REQUIRED_FIELDS == []
        assert not hasattr(User, "username")

    def test_accounts_are_timestamped(self):
        user = User.objects.create_user("ada@example.com", "correct-horse-battery")

        assert user.created_at is not None
        assert user.updated_at is not None
