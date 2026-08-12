
from rest_framework.views import APIView
from rest_framework.permissions import  IsAuthenticated, AllowAny
from user.custom_exceptions.responses import AirAssistResponse

from ..serializers.case_eligibility_serializer import CaseEligibilitySerializer
from ..services.case_state_service import CaseStateService
from ..services.case_eligibility_service import CaseEligibilityService
from ..models.case import Case

class CaseEligibilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, case_id):
        airassist_response = AirAssistResponse()
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return airassist_response.status_not_found_with_message("Case not found.")

        valid = CaseEligibilityService.check_case_eligibility(case)
        return airassist_response.status_ok({"is_eligible": valid})
    
    
class CaseEligibilityUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, case_id):
        serializer = CaseEligibilitySerializer(data=request.data)
        airassist_response = AirAssistResponse()
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return airassist_response.status_not_found_with_message("Case not found.")


        if not serializer.is_valid():
            return airassist_response.status_bad_request(serializer)

        try:
            case = CaseStateService.mark_case_as_valid(
                case
            )
        except ValueError as exc:
            return airassist_response.status_bad_request_with_message(str(exc))

        return airassist_response.status_ok(
            {
                "success": True,
                "message": "Case status updated successfully.",
                "data": {
                    "case_id": case.id,
                    "status": case.status,
                },
            }
        )