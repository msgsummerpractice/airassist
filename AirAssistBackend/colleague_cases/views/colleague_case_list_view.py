from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..permissions import IsColleague
from ..serializers.colleague_case_list_serializer import ColleagueCaseListSerializer
from ..services.colleague_case_list_service import ColleagueCaseListService


class ColleagueCaseListView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]

    def get(self,request):
        cases = ColleagueCaseListService.get_cases()
        serializer = ColleagueCaseListSerializer(cases, many=True)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )