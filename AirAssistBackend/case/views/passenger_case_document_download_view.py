from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from user.permissions import IsPassenger

from ..models.case import Case
from ..models.document import CaseDocument


class PassengerCaseDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsPassenger]

    def get(self, request, pk, document_id):
        user_email = request.user.email.lower()
        owned_cases = Case.objects.filter(passengers__email__iexact=user_email).distinct()
        owned_case = get_object_or_404(owned_cases, pk=pk)
        document = get_object_or_404(
            CaseDocument.objects.filter(case=owned_case),
            pk=document_id,
        )

        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=document.original_filename,
            content_type=document.content_type or "application/octet-stream",
        )