"""Working out whose cart a request is holding.

Signed in, the cart hangs off the account. Anonymous, it is found by an opaque
token in a cookie — httpOnly, because nothing in the page needs to read it.
"""

import uuid

from django.conf import settings

from cart.models import Cart

CART_COOKIE = "oriyoni_cart"
# Long enough that a visitor who wanders off finds their cart again.
CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30


def get_cart(request, create=False):
    """Return the request's cart, or None when there is nothing to show yet.

    Carts are created lazily: merely looking at an empty cart should not leave
    a row behind for every crawler that passes through.
    """
    if request.user and request.user.is_authenticated:
        if create:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            return cart
        return Cart.objects.filter(user=request.user).first()

    cart = None
    token = _parse_token(request.COOKIES.get(CART_COOKIE))
    if token is not None:
        # user__isnull keeps a guessed token from reaching an account's cart.
        cart = Cart.objects.filter(token=token, user__isnull=True).first()

    if cart is None and create:
        cart = Cart.objects.create()

    return cart


def _parse_token(raw):
    """A cookie is whatever the client sent, so it may not be a UUID at all.

    Anything unparseable means "no cart", not a server error.
    """
    if not raw:
        return None
    try:
        return uuid.UUID(raw)
    except (ValueError, AttributeError, TypeError):
        return None


def set_cart_cookie(response, cart):
    """Name the guest cart in a cookie.

    Signed-in carts are found through the account, so they need no cookie —
    and any cookie left over from before the visitor signed in is inert, since
    its cart was merged away and deleted.
    """
    if cart is None or cart.user_id is not None:
        return response

    response.set_cookie(
        CART_COOKIE,
        str(cart.token),
        max_age=CART_COOKIE_MAX_AGE,
        path="/",
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        domain=settings.AUTH_COOKIE_DOMAIN,
    )
    return response
