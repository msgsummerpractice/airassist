from django.db import migrations, models


def replace_legacy_statuses(apps, schema_editor):
    Case = apps.get_model("case", "Case")
    status_mapping = {
        "NEW": "PENDING",
        "VALID": "IN_REVIEW",
        "ASSIGNED": "IN_REVIEW",
        "INVALID": "NON_ELIGIBLE",
    }

    for old_status, new_status in status_mapping.items():
        Case.objects.filter(status=old_status).update(status=new_status)


def restore_legacy_statuses(apps, schema_editor):
    Case = apps.get_model("case", "Case")
    Case.objects.filter(status="PENDING").update(status="NEW")
    Case.objects.filter(status="IN_REVIEW").update(status="ASSIGNED")
    Case.objects.filter(status="NON_ELIGIBLE").update(status="INVALID")


class Migration(migrations.Migration):
    dependencies = [
        ("case", "0015_alter_case_status"),
    ]

    operations = [
        migrations.RunPython(replace_legacy_statuses, restore_legacy_statuses),
        migrations.AlterField(
            model_name="case",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("IN_REVIEW", "In Review"),
                    ("ELIGIBLE", "Eligible"),
                    ("NON_ELIGIBLE", "Non Eligible"),
                    ("AWAITING_DOCUMENTS", "Awaiting Documents"),
                ],
                default="PENDING",
                max_length=20,
            ),
        ),
    ]