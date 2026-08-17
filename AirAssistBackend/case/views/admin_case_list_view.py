from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user.permissions import IsSystemAdmin

from ..serializers.admin_case_list_serializer import AdminCaseListSerializer
from ..services.admin_case_list_service import AdminCaseListService


class AdminCaseListView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get(self, request):
        cases = AdminCaseListService.get_cases()
        serializer = AdminCaseListSerializer(cases, many=True)

        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )