from django.db import transaction
from psycopg2 import DatabaseError
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from ..serializers.case_creation_serializer import CaseCreationSerializer
from ..services.case_service import CaseService

class CaseCreationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CaseCreationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    case = serializer.save()
                
                    CaseService.calculate_case_compensation(case)

                    passenger = case.passengers.first()
                    CaseService.create_passenger_account(passenger)
            except DatabaseError:
                return Response(
                    {
                        "success": False,
                        "message": "Failed to save case. Please try again."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            
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
