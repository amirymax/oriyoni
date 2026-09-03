"""Choosing the photo that stands for a product.

The storefront picks from the whole `images` list client-side, because a
product page lets a shopper flip between colourways. Everywhere a line has
already settled on one colour — a cart line, an order line — the choice is
made here instead, so those payloads carry a URL rather than a gallery.
"""


def photo_for(product, color_id=None):
    """The photo showing `product` in one colourway, or None if it has none.

    A photo tagged with that colour wins; otherwise an untagged one, which
    stands for the product as a whole; otherwise simply the first. This is the
    same order `photoFor` applies in the storefront — the two have to agree, or
    a shopper's cart would show a different photo than the card they clicked.

    Reads `product.images.all()` so a prefetch is used when the caller set one
    up. Without it, this is a query per product.
    """
    photos = list(product.images.all())
    if not photos:
        return None

    return next(
        (photo for photo in photos if photo.color_id == color_id),
        next((photo for photo in photos if photo.color_id is None), photos[0]),
    )


def photo_url_for(product, color_id=None, request=None):
    """`photo_for` as a URL, absolute when there is a request to build it from.

    Serializers that DRF instantiates get the request in their context and so
    return an absolute URL; the ones constructed by hand return the `/media/…`
    path, which the storefront resolves against its own API host.
    """
    photo = photo_for(product, color_id)
    if photo is None:
        return None

    url = photo.image.url
    return request.build_absolute_uri(url) if request else url
