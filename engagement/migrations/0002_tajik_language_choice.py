"""Let a subscriber or a contact message be recorded as Tajik.

Choices are validation rather than schema — the column itself is unchanged —
but Django compares them against the model, so the migration state has to
say so too.
"""

from django.db import migrations, models


def language_field():
    return models.CharField(
        choices=[("en", "English"), ("ru", "Russian"), ("tg", "Tajik")],
        default="en",
        max_length=2,
    )


class Migration(migrations.Migration):
    dependencies = [("engagement", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="newslettersubscriber", name="language", field=language_field()
        ),
        migrations.AlterField(
            model_name="contactmessage", name="language", field=language_field()
        ),
    ]
