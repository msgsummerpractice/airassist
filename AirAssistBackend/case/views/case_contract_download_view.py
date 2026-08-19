from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..enums.document_type_enum import DocumentType
from ..models.case import Case
from ..models.document import CaseDocument
from ..services.case_contract_service import (
    CaseContractGenerationError,
    CaseContractService,
)


class CaseContractDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, case_id):
        contract_document = CaseDocument.objects.filter(
            case_id=case_id,
            document_type=DocumentType.CONTRACT.value,
        ).order_by("-uploaded_at").first()

        if contract_document is not None:
            file_name = contract_document.file.name
            if not file_name or not contract_document.file.storage.exists(file_name):
                case = get_object_or_404(Case.objects.prefetch_related("passengers", "flights"), id=case_id)
                try:
                    contract_document = CaseContractService.generate_for_case(case)
                except CaseContractGenerationError:
                    return Response(
                        {
                            "success": False,
                            "message": "Contract PDF could not be generated for this case.",
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )

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