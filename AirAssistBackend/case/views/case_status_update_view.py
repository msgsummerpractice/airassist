from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from case_email.services.email_service import send_case_status_update_email

from ..custom_exceptions.exceptions import NotFoundAPIException
from ..enums.case_state_enum import CaseState
from colleague_cases.permissions import IsColleague
from ..models.case import Case

DECISION_STATUSES = {
    CaseState.ELIGIBLE.value,
    CaseState.NON_ELIGIBLE.value,
    CaseState.AWAITING_DOCUMENTS.value,
}

class CaseStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]

    def post(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            raise NotFoundAPIException("Case not found.")

        new_status = request.data.get("status")
        if new_status not in DECISION_STATUSES:
            return Response(
                {"error": "Status must be ELIGIBLE, NON_ELIGIBLE, or AWAITING_DOCUMENTS."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            case.status = new_status
            case.save(update_fields=["status", "updated_at"])

            passenger = case.passengers.first()
            note = request.data.get("note", "")

            if not isinstance(note, str):
                return Response(
                    {"error": "Note must be text."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            note = note.strip()
            if len(note) > 1000:
                return Response(
                    {"error": "Note cannot exceed 1000 characters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if new_status in {
                CaseState.NON_ELIGIBLE.value,
                CaseState.AWAITING_DOCUMENTS.value,
            } and not note:
                return Response(
                    {"error": "A note is required for this decision."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            if passenger and passenger.email:
                transaction.on_commit(
                    lambda: send_case_status_update_email(passenger=passenger, case_id=case.id, case_status=new_status, note=note)
                )

        return Response({"message": "Case status updated successfully."}, status=status.HTTP_200_OK)