from django.http import FileResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from colleague_cases.permissions import IsColleague
from user.permissions import IsSystemAdmin

from ..models.document import CaseDocument


class PdfHistoryDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin | IsColleague]

    def get(self, request, document_id):
        document = CaseDocument.objects.filter(id=document_id).first()

        if document is None:
            return Response(
                {"success": False, "message": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=document.original_filename,
            content_type=document.content_type or "application/pdf",
        )
