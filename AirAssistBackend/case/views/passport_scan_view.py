from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.passport_scan_serializer import PassportScanSerializer
from ..services.passport_scan_service import PassportScanService


class PassportScanView(APIView):
    permission_classes = [AllowAny]  
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = PassportScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = PassportScanService.scan(serializer.validated_data["file"])
        return Response(result, status=status.HTTP_200_OK)