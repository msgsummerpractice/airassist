from django.http import FileResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..enums.document_type_enum import DocumentType
from ..models.document import CaseDocument


class CaseContractDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, case_id):
        contract_document = CaseDocument.objects.filter(
            case_id=case_id,
            document_type=DocumentType.CONTRACT.value,
        ).order_by("-uploaded_at").first()

        if contract_document is None:
            return Response(
                {
                    "success": False,
                    "message": "Contract PDF not found for this case.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            contract_document.file.open("rb"),
            as_attachment=True,
            filename=contract_document.original_filename,
            content_type=contract_document.content_type or "application/pdf",
        )