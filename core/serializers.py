from rest_framework import serializers

from core.languages import FALLBACKS, LANGUAGES


class LocalizedField(serializers.Field):
    """Folds a set of `<prefix>_<lang>` columns into one object.

    Emits `{"en": …, "ru": …, "tg": …}`, which is the storefront's
    `Localized<T>` type, so a language switch needs no round trip to the API.

    A column that is still empty borrows another language's copy rather than
    handing the storefront a blank product name — see `core.languages`.
    """

    def __init__(self, prefix, **kwargs):
        self.prefix = prefix
        # Defaults to the object being serialized, but callers can point at a
        # related one — a cart line reads its names off `variant.product`.
        kwargs.setdefault("source", "*")
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, instance):
        values = {lang: getattr(instance, f"{self.prefix}_{lang}") for lang in LANGUAGES}
        return {lang: value or self._fallback(values, lang) for lang, value in values.items()}

    @staticmethod
    def _fallback(values, lang):
        for candidate in FALLBACKS[lang]:
            if values[candidate]:
                return values[candidate]
        # Everything is empty, so there is nothing better to show than the
        # empty value itself — and its type ("" or []) still has to be right.
        return values[lang]
