"""The languages the storefront ships in.

One list, because three separate things have to agree on it: the
`_en`/`_ru`/`_tg` column triples the catalogue stores its copy in, the
`language` columns that record which language a visitor wrote to us in, and
the folded `{"en": …, "ru": …, "tg": …}` payload the storefront reads.
"""

LANGUAGES = ("en", "ru", "tg")

LANGUAGE_CHOICES = [("en", "English"), ("ru", "Russian"), ("tg", "Tajik")]

# What to show when a translation has not been filled in yet — a product added
# before Tajik existed has no Tajik name, and a blank name is worse than a
# Russian one. Russian is read widely in Tajikistan, so it comes before English.
FALLBACKS = {"en": (), "ru": ("en",), "tg": ("ru", "en")}
