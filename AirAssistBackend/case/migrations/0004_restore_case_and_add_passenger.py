from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("case", "0003_delete_case"),
    ]

    operations = [
        migrations.CreateModel(
            name="Case",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("NEW", "New"),
                            ("VALID", "Eligible"),
                            ("ASSIGNED", "Assigned"),
                            ("INVALID", "Invalid"),
                        ],
                        default="NEW",
                        max_length=20,
                    ),
                ),
                ("gdpr_consent", models.BooleanField(default=True)),
                ("gdpr_consent_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="CasePassenger",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("date_of_birth", models.DateField()),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=20, null=True)),
                ("address", models.TextField(blank=True, null=True)),
                ("postal_code", models.CharField(blank=True, max_length=20, null=True)),
                (
                    "case",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="passengers",
                        to="case.case",
                    ),
                ),
            ],
        ),
    ]
