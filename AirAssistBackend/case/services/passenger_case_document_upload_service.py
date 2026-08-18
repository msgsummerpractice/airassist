from django.shortcuts import get_object_or_404

from ..models.case import Case
from ..models.document import CaseDocument


class PassengerCaseDocumentUploadService:
    @staticmethod
    def upload_document(case_id, user, validated_data):
        owned_cases = Case.objects.filter(passengers__email__iexact=user.email.lower())
        owned_case = get_object_or_404(owned_cases, pk=case_id)
        uploaded_file = validated_data["file"]

        return CaseDocument.objects.create(
            case=owned_case,
            document_type=validated_data["document_type"],
            file=uploaded_file,
            original_filename=uploaded_file.name,
            content_type=getattr(uploaded_file, "content_type", ""),
            file_size=uploaded_file.size,
        )
