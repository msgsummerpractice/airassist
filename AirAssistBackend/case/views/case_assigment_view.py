from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from user.custom_exceptions.responses import AirAssistResponse

from ..custom_exceptions.exceptions import NotFoundAPIException
from ..serializers.case_assigment_serializer import CaseAssignmentSerializer
from ..services.case_state_service import CaseStateService
from ..models.case import Case
from user.models.users import User

class CaseAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, case_id):
        airassist_response = AirAssistResponse()        

        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            raise NotFoundAPIException("Case not found.")

        serializer = CaseAssignmentSerializer(data=request.data)
        

        if not serializer.is_valid():
            return airassist_response.status_bad_request(serializer)

        try:
            colleague = User.objects.select_related("role").get(
                id=serializer.validated_data["colleague_id"]
            )
        except User.DoesNotExist:
            raise NotFoundAPIException("Colleague not found.")

        case = CaseStateService.mark_case_as_assigned(case, colleague)

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