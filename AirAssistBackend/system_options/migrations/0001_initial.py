from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("user", "0007_alter_role_id_alter_user_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="SystemOption",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("option_type", models.CharField(choices=[("EMAIL_PRESET", "Email_Preset"), ("PDF_PRESET", "Pdf_Preset")], max_length=40, unique=True)),
                ("configuration", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="updated_system_options", to="user.user")),
            ],
            options={
                "ordering": ["option_type"],
            },
        ),
    ]
