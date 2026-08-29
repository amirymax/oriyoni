from rest_framework import serializers


class LocalizedField(serializers.Field):
    """Folds a pair of `<prefix>_en` / `<prefix>_ru` columns into one object.

    Emits `{"en": …, "ru": …}`, which is the storefront's `Localized<T>` type,
    so a language switch needs no round trip to the API.
    """

    def __init__(self, prefix, **kwargs):
        self.prefix = prefix
        # Defaults to the object being serialized, but callers can point at a
        # related one — a cart line reads its names off `variant.product`.
        kwargs.setdefault("source", "*")
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, instance):
        return {lang: getattr(instance, f"{self.prefix}_{lang}") for lang in ("en", "ru")}
