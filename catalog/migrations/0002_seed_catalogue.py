"""Seed the catalogue the storefront used to hardcode.

The data was extracted from frontend/src/lib/products.ts rather than retyped,
and lives in seed/initial_catalogue.json next to this migration so it stays
frozen at what shipped. Editing the catalogue afterwards is the admin's job,
not this file's.

Variants are the cross product of each product's colours and sizes, which is
the shape the storefront already assumed when it built cart keys from
slug + colour + size. Opening stock is nominal — real counts come from
whoever runs the shop.
"""

import json
from pathlib import Path

from django.db import migrations

SEED = Path(__file__).resolve().parent / "seed" / "initial_catalogue.json"

# Enough for the storefront to be browsable and buyable out of the box.
OPENING_STOCK = 25


def load_seed():
    return json.loads(SEED.read_text(encoding="utf-8"))


def make_sku(product_slug, color_slug, size):
    """A readable, stable SKU: ORI-CROWN-EMBLEM-TEE-BLACK-M."""
    parts = [product_slug, color_slug, size.replace(" ", "-")]
    return "ORI-" + "-".join(part.upper() for part in parts)


def seed(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Color = apps.get_model("catalog", "Color")
    Product = apps.get_model("catalog", "Product")
    ProductVariant = apps.get_model("catalog", "ProductVariant")

    data = load_seed()

    categories = {
        row["slug"]: Category.objects.create(**row) for row in data["categories"]
    }
    colors = {row["slug"]: Color.objects.create(**row) for row in data["colors"]}

    for row in data["products"]:
        color_slugs = row.pop("colors")
        sizes = row.pop("sizes")
        product = Product.objects.create(
            **{**row, "category": categories[row["category"]]},
        )

        ProductVariant.objects.bulk_create(
            ProductVariant(
                product=product,
                color=colors[color_slug],
                size=size,
                sku=make_sku(product.slug, color_slug, size),
                stock=OPENING_STOCK,
            )
            for color_slug in color_slugs
            for size in sizes
        )


def unseed(apps, schema_editor):
    data = load_seed()
    apps.get_model("catalog", "Product").objects.filter(
        slug__in=[row["slug"] for row in data["products"]]
    ).delete()
    apps.get_model("catalog", "Color").objects.filter(
        slug__in=[row["slug"] for row in data["colors"]]
    ).delete()
    apps.get_model("catalog", "Category").objects.filter(
        slug__in=[row["slug"] for row in data["categories"]]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]

    operations = [migrations.RunPython(seed, unseed)]
