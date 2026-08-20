from django.db.models import Prefetch
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.permissions import IsSystemAdmin

from ..custom_exceptions.exceptions import NotFoundAPIException
from ..models.case import Case
from ..models.comment import Comment
from ..models.document import CaseDocument
from ..models.flights import Flight
from ..models.passengers import Passenger
from ..serializers.admin_case_details_serializer import AdminCaseDetailsSerializer
from ..services.case_deletion_service import CaseDeletionService


class CaseDeletionView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get(self, request, case_id):
        case = (
            Case.objects.prefetch_related(
                Prefetch("passengers", queryset=Passenger.objects.order_by("id")),
                Prefetch("flights", queryset=Flight.objects.order_by("id")),
                Prefetch(
                    "documents",
                    queryset=CaseDocument.objects.order_by("-uploaded_at", "-id"),
                ),
                Prefetch(
                    "comments",
                    queryset=Comment.objects.select_related("author", "author__role").order_by(
                        "created_at", "id"
                    ),
                ),
            )
            .filter(pk=case_id)
            .first()
        )

        if case is None:
            return Response(
                {"message": "Case not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(AdminCaseDetailsSerializer(case).data, status=status.HTTP_200_OK)

    def delete(self, request, case_id):
        try:
            CaseDeletionService.delete_case(case_id)
        except Case.DoesNotExist:
            raise NotFoundAPIException("Case not found.")

        return Response(
            {
                "success": True,
                "message": "Case deleted successfully.",
                "data": {"case_id": case_id},
            },
            status=status.HTTP_200_OK,
        )