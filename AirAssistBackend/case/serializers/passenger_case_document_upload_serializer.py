from rest_framework import serializers

from ..constants import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from ..enums.document_type_enum import DocumentType


class PassengerCaseDocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    document_type = serializers.ChoiceField(choices=DocumentType.choices())

    def validate_file(self, value):
        if not value.name.lower().endswith(ALLOWED_EXTENSIONS):
            raise serializers.ValidationError("Only PDF or JPG/JPEG files are allowed.")

        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("Maximum file size is 5 MB.")

        return value
