from django.db import transaction

from ..constants import DEFAULT_EMAIL_PRESET, DEFAULT_PDF_PRESET
from ..enums import SystemOptionType
from ..models import SystemOption


class SystemOptionService:
    DEFAULTS = {
        SystemOptionType.EMAIL_PRESET.value: DEFAULT_EMAIL_PRESET,
        SystemOptionType.PDF_PRESET.value: DEFAULT_PDF_PRESET,
    }

    @staticmethod
    def get_settings():
        option_map = {}
        for option_type, default_configuration in SystemOptionService.DEFAULTS.items():
            option, _ = SystemOption.objects.get_or_create(
                option_type=option_type,
                defaults={"configuration": default_configuration},
            )
            option_map[option_type] = option.configuration

        return {
            "email_preset": option_map[SystemOptionType.EMAIL_PRESET.value],
            "pdf_preset": option_map[SystemOptionType.PDF_PRESET.value],
        }

    @staticmethod
    @transaction.atomic
    def update_settings(*, email_preset, pdf_preset, updated_by):
        SystemOptionService._upsert_option(
            option_type=SystemOptionType.EMAIL_PRESET.value,
            configuration=email_preset,
            updated_by=updated_by,
        )
        SystemOptionService._upsert_option(
            option_type=SystemOptionType.PDF_PRESET.value,
            configuration=pdf_preset,
            updated_by=updated_by,
        )
        return SystemOptionService.get_settings()

    @staticmethod
    def _upsert_option(*, option_type, configuration, updated_by):
        SystemOption.objects.update_or_create(
            option_type=option_type,
            defaults={
                "configuration": configuration,
                "updated_by": updated_by,
            },
        )
