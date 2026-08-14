import json

from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


from ..serializers.case_creation_serializer import CaseCreationSerializer
from ..serializers.disruption_serializer import DisruptionSerializer
from ..services.case_eligibility_service import CaseEligibilityService
from ..models.disruption import Disruption


class CaseEligibilityView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if "disruption" in request.data and "flight_date" not in request.data:
            disruption_value = request.data.get("disruption")
            try:
                disruption_serializer = DisruptionSerializer(
                    data=json.loads(disruption_value)
                )
            except (TypeError, json.JSONDecodeError):
                return Response(
                    {
                        "success": False,
                        "message": "Disruption must be valid JSON.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not disruption_serializer.is_valid():
                return Response(
                    {
                        "success": False,
                        "errors": disruption_serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            disruption_probe = Disruption(**disruption_serializer.validated_data)
            is_eligible, reason = (
                CaseEligibilityService.check_disruption_eligibility_with_reason(
                    disruption_probe
                )
            )
            return self._eligibility_response(is_eligible, reason)

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

        return self._eligibility_response(is_eligible, reason)

    def _eligibility_response(self, is_eligible, reason):
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
            status=status.HTTP_200_OK,
        )