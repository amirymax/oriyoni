from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from accounts.models import User
from accounts.tokens import email_verification_token_generator
from core.languages import LANGUAGES


class UserSerializer(serializers.ModelSerializer):
    """The shape of `me` — everything the storefront shows about an account."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)
    # A boolean rather than the timestamp: the storefront only ever asks
    # whether to show the nudge, and the date is nobody's business but the
    # shop's.
    email_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "email_verified",
            "is_staff",
            "created_at",
        ]
        # Email is the login credential. Changing it is an account takeover
        # vector without a confirmation step, so it is not editable here.
        # is_staff lets the storefront gate the admin panel link; a shopper
        # cannot grant it to themselves since it is read-only.
        read_only_fields = ["id", "email", "is_staff", "created_at"]


class PasswordField(serializers.CharField):
    """A write-only password that is run through Django's validators."""

    def __init__(self, **kwargs):
        kwargs.setdefault("write_only", True)
        kwargs.setdefault("style", {"input_type": "password"})
        kwargs.setdefault("trim_whitespace", False)
        kwargs.setdefault("max_length", 128)
        super().__init__(**kwargs)

    def run_validation(self, data=serializers.empty):
        value = super().run_validation(data)
        try:
            # user=None: the similarity check needs the account, so callers
            # that have one re-run validation with it.
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = PasswordField()
    # Not stored anywhere: it only decides which language the confirmation
    # email is written in, the same way the reset request carries it.
    language = serializers.ChoiceField(choices=LANGUAGES, default="en", write_only=True)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "language"]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate_email(self, value):
        # The model lowercases on save; normalise here too so the duplicate
        # check below sees the same string the index will.
        email = User.objects.normalize_email(value.strip())
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        # Re-run the validators now that the other fields are known, so
        # "ada@example.com" is rejected as a password for ada@example.com.
        unsaved = User(**{k: v for k, v in attrs.items() if k not in {"password", "language"}})
        _validate_password_against_user(attrs["password"], unsaved, field="password")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        # The view still reads it off validated_data; save() hands create() a
        # copy, so popping here does not take it away.
        validated_data.pop("language", None)
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        if user is None:
            # Deliberately the same message for an unknown address, a wrong
            # password and a deactivated account: distinguishing them tells an
            # attacker which addresses have accounts.
            raise serializers.ValidationError("Incorrect email or password.")

        attrs["user"] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = PasswordField()

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Your current password is incorrect.")
        return value

    def validate(self, attrs):
        _validate_password_against_user(
            attrs["new_password"], self.context["request"].user, field="new_password"
        )
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    # The storefront knows which language the visitor is reading in; Django
    # would otherwise have to guess from Accept-Language.
    language = serializers.ChoiceField(choices=LANGUAGES, default="en")


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = PasswordField()

    def validate(self, attrs):
        user = _user_from_uid(attrs["uid"])

        if user is None or not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": ["This reset link is invalid or has expired."]}
            )

        _validate_password_against_user(attrs["new_password"], user, field="new_password")
        attrs["user"] = user
        return attrs


class EmailVerificationResendSerializer(serializers.Serializer):
    email = serializers.EmailField()
    language = serializers.ChoiceField(choices=LANGUAGES, default="en")


class EmailVerificationConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):
        user = _user_from_uid(attrs["uid"])

        # A used link fails here too: redeeming one stamps email_verified_at,
        # which the token hashes, so the second attempt no longer matches.
        if user is None or not email_verification_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": ["This confirmation link is invalid or has expired."]}
            )

        attrs["user"] = user
        return attrs


def _user_from_uid(uid):
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        return User.objects.get(pk=pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


def _validate_password_against_user(password, user, field):
    """Run the validators that need the account, e.g. similarity to the email."""
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError({field: list(exc.messages)}) from exc
