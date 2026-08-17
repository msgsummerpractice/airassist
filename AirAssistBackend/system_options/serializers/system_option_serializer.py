import re

from rest_framework import serializers

from ..constants import (
    ALLOWED_EMAIL_PLACEHOLDERS,
    ALLOWED_PDF_FIELDS,
    ALLOWED_PDF_PAGE_SIZES,
    MAX_TEMPLATE_LENGTH,
)
from ..enums import EmailDeliveryMode, PdfLayout


PLACEHOLDER_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_]+)\s*}}")


class EmailPresetSerializer(serializers.Serializer):
    delivery_mode = serializers.ChoiceField(
        choices=[mode.value for mode in EmailDeliveryMode],
    )
    sender_name = serializers.CharField(max_length=120)
    sender_email = serializers.EmailField()
    reply_to_email = serializers.EmailField(required=False, allow_blank=True)
    smtp_host = serializers.CharField(max_length=255, required=False, allow_blank=True)
    smtp_port = serializers.IntegerField(required=False, min_value=1, max_value=65535)
    smtp_username = serializers.CharField(max_length=255, required=False, allow_blank=True)
    use_tls = serializers.BooleanField()
    subject_template = serializers.CharField(max_length=255)
    body_template = serializers.CharField(max_length=MAX_TEMPLATE_LENGTH)
    footer_text = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate(self, attrs):
        self._validate_placeholders(attrs.get("subject_template", ""), "subject_template")
        self._validate_placeholders(attrs.get("body_template", ""), "body_template")

        if attrs["delivery_mode"] == EmailDeliveryMode.SMTP.value:
            missing_fields = [
                field_name
                for field_name in ("smtp_host", "smtp_port", "smtp_username")
                if not attrs.get(field_name)
            ]
            if missing_fields:
                raise serializers.ValidationError(
                    {
                        field_name: "This field is required when SMTP delivery is used."
                        for field_name in missing_fields
                    }
                )

        return attrs

    def _validate_placeholders(self, template, field_name):
        placeholders = set(PLACEHOLDER_PATTERN.findall(template))
        unsupported = sorted(placeholders - ALLOWED_EMAIL_PLACEHOLDERS)
        if unsupported:
            raise serializers.ValidationError(
                {
                    field_name: (
                        "Unsupported placeholders: " + ", ".join(unsupported)
                    )
                }
            )


class PdfPresetSerializer(serializers.Serializer):
    layout = serializers.ChoiceField(choices=[layout.value for layout in PdfLayout])
    page_size = serializers.ChoiceField(choices=sorted(ALLOWED_PDF_PAGE_SIZES))
    include_branding = serializers.BooleanField()
    include_disruption_summary = serializers.BooleanField()
    include_passenger_contact = serializers.BooleanField()
    include_case_timeline = serializers.BooleanField()
    exported_fields = serializers.ListField(
        child=serializers.ChoiceField(choices=sorted(ALLOWED_PDF_FIELDS)),
        allow_empty=False,
    )
    footer_text = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_exported_fields(self, value):
        unique_fields = list(dict.fromkeys(value))
        if len(unique_fields) != len(value):
            raise serializers.ValidationError("Duplicate exported fields are not allowed.")
        return unique_fields


class SystemOptionSerializer(serializers.Serializer):
    email_preset = EmailPresetSerializer()
    pdf_preset = PdfPresetSerializer()
