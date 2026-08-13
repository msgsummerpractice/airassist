
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


from ..serializers.case_creation_serializer import CaseCreationSerializer
from ..services.case_eligibility_service import CaseEligibilityService
from ..models.disruption import Disruption


class CaseEligibilityView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CaseCreationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        disruption_data = serializer.validated_data.get("disruption")
        if not disruption_data:
           return Response(
                {
                    "success": False,
                    "message": "Disruption data is required.",
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        disruption_probe = Disruption(**disruption_data)
        is_eligible, reason = CaseEligibilityService.check_disruption_eligibility_with_reason(disruption_probe)

        message = (
            "Case is eligible for submission"
            if is_eligible
            else "Case is NOT eligible for submission"
        )

        return Response(
            {
                "success": True,
                "is_eligible": is_eligible,
                "message": message,
                "reason": reason,
            },
            status=status.HTTP_200_OK
        )