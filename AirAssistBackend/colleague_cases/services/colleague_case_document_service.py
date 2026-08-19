from django.shortcuts import get_object_or_404

from case.models.case import Case
from case.models.document import CaseDocument


class ColleagueCaseDocumentService:
    @staticmethod
    def upload_document(case_id, user, validated_data):
        assigned_case = get_object_or_404(
            Case.objects.filter(assigned_colleague=user),
            pk=case_id,
        )
        uploaded_file = validated_data["file"]

        return CaseDocument.objects.create(
            case=assigned_case,
            document_type=validated_data["document_type"],
            uploaded_by="COLLEAGUE",
            file=uploaded_file,
            original_filename=uploaded_file.name,
            content_type=getattr(uploaded_file, "content_type", ""),
            file_size=uploaded_file.size,
        )

    @staticmethod
    def get_document_for_download(case_id, document_id, user):
        assigned_case = get_object_or_404(
            Case.objects.filter(assigned_colleague=user),
            pk=case_id,
        )

        return get_object_or_404(
            CaseDocument.objects.filter(case=assigned_case),
            pk=document_id,
        )