from django.core.paginator import Paginator
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from colleague_cases.permissions import IsColleague
from user.permissions import IsSystemAdmin

from ..enums.document_type_enum import DocumentType
from ..serializers.pdf_history_serializer import PdfHistorySerializer
from ..services.pdf_history_service import PdfHistoryService


class PdfHistoryListView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin | IsColleague]

    def get(self, request):
        document_type = request.query_params.get("document_type")
        valid_types = [choice[0] for choice in DocumentType.choices()]
        if document_type and document_type not in valid_types:
            return Response(
                {"succes": False, "message": "Invalid document_type filter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filters = {
            "case_id": request.query_params.get("case_id"),
            "document_type": document_type,
            "passenger_name": request.query_params.get("passenger_name"),
            "uploaded_from": request.query_params.get("uploaded_from"),
            "uploaded_to": request.query_params.get("uploaded_to"),
        }

        documents = PdfHistoryService.get_documents(filters)

        try:
            page_size = int(request.query_params.get("page_size", 20))
        except ValueError:
            page_size = 20

        paginator = Paginator(documents, page_size)
        page = paginator.get_page(request.query_params.get("page", 1))
        serializer = PdfHistorySerializer(page.object_list, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
                "pagination": {
                    "count": paginator.count,
                    "page": page.number,
                    "page_size": paginator.per_page,
                    "num_pages": paginator.num_pages,
                },
            },
            status=status.HTTP_200_OK,
        )
