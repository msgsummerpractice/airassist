from copy import deepcopy
import os

from django.db import transaction

from ..constants import DEFAULT_EMAIL_PRESET, DEFAULT_PDF_PRESET
from ..enums import SystemOptionType
from ..models import SystemOption


class SystemOptionService:
    PLACEHOLDER_EMAIL = "support@airassist.eu"
    DEFAULTS = {
        SystemOptionType.EMAIL_PRESET.value: DEFAULT_EMAIL_PRESET,
        SystemOptionType.PDF_PRESET.value: DEFAULT_PDF_PRESET,
    }

    @staticmethod
    def get_settings():
        return {
            "email_preset": SystemOptionService.get_email_preset(),
            "pdf_preset": SystemOptionService.get_pdf_preset(),
        }

    @staticmethod
    def get_email_preset():
        return SystemOptionService._get_option_configuration(
            SystemOptionType.EMAIL_PRESET.value,
        )

    @staticmethod
    def get_pdf_preset():
        return SystemOptionService._get_option_configuration(
            SystemOptionType.PDF_PRESET.value,
        )

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

    @staticmethod
    def _get_option_configuration(option_type):
        default_configuration = deepcopy(SystemOptionService.DEFAULTS[option_type])
        option, _ = SystemOption.objects.get_or_create(
            option_type=option_type,
            defaults={"configuration": default_configuration},
        )

        stored_configuration = option.configuration or {}
        configuration = {
            **default_configuration,
            **stored_configuration,
        }

        if option_type == SystemOptionType.EMAIL_PRESET.value:
            return SystemOptionService._normalize_email_preset(configuration)

        return configuration

    @staticmethod
    def _normalize_email_preset(configuration):
        resolved_configuration = deepcopy(configuration)
        real_mailbox = os.getenv("EMAIL_HOST_USER") or os.getenv("DEFAULT_FROM_EMAIL")

        if not real_mailbox:
            return resolved_configuration

        for key in ("sender_email", "reply_to_email", "smtp_username"):
            value = resolved_configuration.get(key)
            if value in {None, "", SystemOptionService.PLACEHOLDER_EMAIL}:
                resolved_configuration[key] = real_mailbox

        return resolved_configuration
