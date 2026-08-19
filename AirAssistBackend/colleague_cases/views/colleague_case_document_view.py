from django.http import FileResponse
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..permissions import IsColleague
from ..serializers.colleague_case_document_serializer import (
    ColleagueCaseDocumentSerializer,
    ColleagueCaseDocumentUploadSerializer,
)
from ..services.colleague_case_document_service import ColleagueCaseDocumentService
from case.services.case_document_deletion_service import CaseDocumentDeletionService


class ColleagueCaseDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        serializer = ColleagueCaseDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = ColleagueCaseDocumentService.upload_document(
            case_id=pk,
            user=request.user,
            validated_data=serializer.validated_data,
        )

        response_data = ColleagueCaseDocumentSerializer(document).data
        response_data["message"] = "Document uploaded successfully."

        return Response(response_data, status=status.HTTP_201_CREATED)


class ColleagueCaseDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]

    def get(self, request, pk, document_id):
        document = ColleagueCaseDocumentService.get_document_for_download(
            case_id=pk,
            document_id=document_id,
            user=request.user,
        )

        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=document.original_filename,
            content_type=document.content_type or "application/octet-stream",
        )

    def delete(self, request, pk, document_id):
        CaseDocumentDeletionService.delete_document(
            case_id=pk,
            document_id=document_id,
            user=request.user,
            uploaded_by="COLLEAGUE",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)