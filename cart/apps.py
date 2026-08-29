from django.apps import AppConfig


class CartConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cart"

    def ready(self):
        # Connects the guest-cart merge to the sign-in signal.
        from cart import receivers  # noqa: F401
