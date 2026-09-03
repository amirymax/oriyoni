"""Add the Tajik half of the order line snapshot.

Lines written before Tajik existed keep an empty string: the order they
belong to was placed and confirmed in English or Russian, and inventing a
translation for it after the fact would misrepresent what the shopper saw.
The serializer falls back to Russian when it renders one.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("orders", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="orderitem",
            name="name_tg",
            field=models.CharField(default="", max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="orderitem",
            name="color_name_tg",
            field=models.CharField(default="", max_length=60),
            preserve_default=False,
        ),
    ]
