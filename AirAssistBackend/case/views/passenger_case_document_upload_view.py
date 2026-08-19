from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.permissions import IsPassenger

from ..serializers.passenger_case_document_upload_serializer import (
    PassengerCaseDocumentUploadSerializer,
)
from ..serializers.passenger_case_details_serializer import (
    PassengerCaseDocumentSerializer,
)
from ..services.passenger_case_document_upload_service import (
    PassengerCaseDocumentUploadService,
)
from ..services.case_document_deletion_service import CaseDocumentDeletionService


class PassengerCaseDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated, IsPassenger]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        serializer = PassengerCaseDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = PassengerCaseDocumentUploadService.upload_document(
            case_id=pk,
            user=request.user,
            validated_data=serializer.validated_data,
        )

        response_data = PassengerCaseDocumentSerializer(
            document, context={"request": request}
        ).data
        response_data["message"] = "Document uploaded successfully."

        return Response(response_data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk, document_id):
        CaseDocumentDeletionService.delete_document(
            case_id=pk,
            document_id=document_id,
            user=request.user,
            uploaded_by="PASSENGER",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
