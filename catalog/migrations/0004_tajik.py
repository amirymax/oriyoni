"""Add the Tajik half of every translated column, and fill in the seed.

The `_tg` columns are required, like their `_en`/`_ru` siblings, so they are
added with an empty default that is not preserved: rows that already exist
get an empty string, and everything written afterwards has to supply one.

The catalogue that shipped with migration 0002 is then translated in place.
Its Tajik copy lives in seed/tajik_catalogue.json rather than in
seed/initial_catalogue.json, because 0002 hands each row straight to
`objects.create()` — a `name_tg` key in that file would be passed to a
historical model that does not have the column yet.
"""

import json
from pathlib import Path

import django.contrib.postgres.fields
from django.db import migrations, models

SEED = Path(__file__).resolve().parent / "seed" / "tajik_catalogue.json"


def load_seed():
    return json.loads(SEED.read_text(encoding="utf-8"))


def translate(apps, schema_editor):
    data = load_seed()

    for model_name, key in (("Category", "categories"), ("Color", "colors")):
        model = apps.get_model("catalog", model_name)
        for slug, name_tg in data[key].items():
            model.objects.filter(slug=slug).update(name_tg=name_tg)

    Product = apps.get_model("catalog", "Product")
    for slug, fields in data["products"].items():
        Product.objects.filter(slug=slug).update(**fields)


def untranslate(apps, schema_editor):
    """Blank what this migration filled in, so re-applying it is a no-op.

    The columns themselves are dropped by the reverse of the AddFields above;
    this only matters when the data step is reversed on its own.
    """
    data = load_seed()

    for model_name, key in (("Category", "categories"), ("Color", "colors")):
        model = apps.get_model("catalog", model_name)
        model.objects.filter(slug__in=data[key]).update(name_tg="")

    apps.get_model("catalog", "Product").objects.filter(slug__in=data["products"]).update(
        name_tg="", description_tg="", details_tg=[]
    )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0003_productimage")]

    operations = [
        migrations.AddField(
            model_name="category",
            name="name_tg",
            field=models.CharField(default="", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="color",
            name="name_tg",
            field=models.CharField(default="", max_length=60),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="product",
            name="name_tg",
            field=models.CharField(default="", max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="product",
            name="description_tg",
            field=models.TextField(default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="product",
            name="details_tg",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=200),
                blank=True,
                default=list,
                size=None,
            ),
        ),
        migrations.RunPython(translate, untranslate),
    ]
