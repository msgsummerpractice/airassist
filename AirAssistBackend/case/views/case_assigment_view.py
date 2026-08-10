from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from user.custom_exceptions.airassist_response import AirAssistResponse

from ..serializers.case_assigment_serializer import CaseAssignmentSerializer
from ..services.case_state_service import CaseStateService
from ..models.case import Case
from user.models.models import User

class CaseAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return airassist_response.status_not_found_with_message("Case not found.")

        serializer = CaseAssignmentSerializer(data=request.data)
        airassist_response = AirAssistResponse()

        if not serializer.is_valid():
            return airassist_response.status_bad_request(serializer)

        try:
            colleague = User.objects.select_related("role").get(
                id=serializer.validated_data["colleague_id"]
            )
        except User.DoesNotExist:
            return airassist_response.status_not_found_with_message("Colleague not found.")


        try:
            case = CaseStateService.mark_case_as_assigned(case, colleague)
        except ValueError as exc:
            return airassist_response.status_bad_request_with_message(str(exc))

        return airassist_response.status_ok(
            {
                "success": True,
                "message": "Case assigned successfully.",
                "data": {
                    "case_id": case.id,
                    "status": case.status,
                    "assigned_colleague_id": case.assigned_colleague_id,
                },
            }
        )