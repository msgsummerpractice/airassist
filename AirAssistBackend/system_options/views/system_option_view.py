from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from user.custom_exceptions.responses import AirAssistResponse
from user.permissions import IsSystemAdmin

from ..serializers import SystemOptionSerializer
from ..services import SystemOptionService


class SystemOptionView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get(self, request):
        airassist_response = AirAssistResponse()
        data = SystemOptionService.get_settings()
        return airassist_response.status_ok({"data": data})

    def patch(self, request):
        serializer = SystemOptionSerializer(data=request.data)
        airassist_response = AirAssistResponse()

        if not serializer.is_valid():
            return airassist_response.status_bad_request(serializer.errors)

        settings_data = SystemOptionService.update_settings(
            email_preset=serializer.validated_data["email_preset"],
            pdf_preset=serializer.validated_data["pdf_preset"],
            updated_by=request.user,
        )
        return airassist_response.status_ok(
            {
                "message": "System options saved successfully.",
                "data": settings_data,
            }
        )
