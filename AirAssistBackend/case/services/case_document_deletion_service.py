from django.shortcuts import get_object_or_404
from django.db.models import Q

from ..models.case import Case
from ..models.document import CaseDocument


class CaseDocumentDeletionService:
    @staticmethod
    def delete_document(case_id, document_id, user, uploaded_by):
        if uploaded_by == "PASSENGER":
            accessible_cases = Case.objects.filter(
                passengers__email__iexact=user.email.lower()
            )
        else:
            accessible_cases = Case.objects.filter(assigned_colleague=user)

        document = get_object_or_404(
            CaseDocument.objects.filter(
                case__in=accessible_cases,
                case_id=case_id,
            ).filter(
                Q(uploaded_by=uploaded_by) | Q(uploaded_by__isnull=True)
            ),
            pk=document_id,
        )

        if document.file:
            document.file.delete(save=False)
        document.delete()