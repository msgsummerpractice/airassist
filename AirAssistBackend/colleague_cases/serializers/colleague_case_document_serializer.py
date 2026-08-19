from rest_framework import serializers

from case.enums.document_type_enum import DocumentType
from case.models.document import CaseDocument

from ..constants import (
    ALLOWED_DOCUMENT_EXTENSIONS,
    ALLOWED_DOCUMENT_MIME_TYPES,
    MAX_DOCUMENT_SIZE_BYTES,
)


class ColleagueCaseDocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    document_type = serializers.ChoiceField(choices=DocumentType.choices())

    def validate_file(self, value):
        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        content_type = getattr(value, "content_type", "")

        if value.size > MAX_DOCUMENT_SIZE_BYTES:
            raise serializers.ValidationError("Maximum file size is 5 MB.")

        if (
            content_type not in ALLOWED_DOCUMENT_MIME_TYPES
            and extension not in ALLOWED_DOCUMENT_EXTENSIONS
        ):
            raise serializers.ValidationError("Only PDF or JPG/JPEG files are allowed.")

        return value


class ColleagueCaseDocumentSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source="original_filename", read_only=True)

    class Meta:
        model = CaseDocument
        fields = ["id", "document_type", "filename", "uploaded_at", "uploaded_by"]
