from django.db import transaction
from django.dispatch import receiver

from accounts.signals import user_signed_in
from cart.models import Cart
from cart.session import CART_COOKIE


@receiver(user_signed_in)
def merge_guest_cart(sender, request, user, **kwargs):
    """Fold whatever the visitor had in hand into their account's cart.

    Shopping first and signing in later is the common order, so losing the
    basket at the login form would be the wrong behaviour. The listener lives
    here rather than in accounts so that authentication stays unaware of the
    shop.
    """
    token = request.COOKIES.get(CART_COOKIE)
    if not token:
        return

    with transaction.atomic():
        guest = Cart.objects.filter(token=token, user__isnull=True).first()
        if guest is None:
            return

        owned = Cart.objects.filter(user=user).first()
        if owned is None:
            # Nothing to merge into: adopt the guest cart wholesale.
            guest.user = user
            guest.save(update_fields=["user", "updated_at"])
            return

        owned.merge_from(guest)
