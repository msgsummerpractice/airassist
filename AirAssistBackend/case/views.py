from django.shortcuts import render
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission

from .serializers import CaseCreationSerializer
from .services.case_service import CaseService

from .serializers import CaseCreationSerializer
# Create your views here.
class CaseCreationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CaseCreationSerializer(data=request.data)
        if serializer.is_valid():
            case = serializer.save()

            # Calculate compensation
            CaseService.calculate_case_compensation(case)

            passenger = case.passengers.first()
            CaseService.create_passenger_account(passenger)
            
            return Response(
                {
                    "success": True,
                    "message": "Case created successfully.",
                    "data": {
                        "case_id": case.id,
                        "status": case.status,
                        "created_at": case.created_at,
                    }
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                "success": False,
                "errors": serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )