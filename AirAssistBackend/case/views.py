from django.db import transaction
from django.shortcuts import render
from psycopg2 import DatabaseError
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from user.custom_exceptions.airassist_response import AirAssistResponse

from .serializers import CaseCreationSerializer
from .services.case_service import CaseService
from .services.case_state_service import CaseStateService
from .models.case_models import Case
from user.models.models import User

from .serializers import CaseCreationSerializer,CaseEligibilitySerializer,CaseAssignmentSerializer

# Create your views here.
class CaseCreationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CaseCreationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    case = serializer.save()
                
                    # Calculate compensation
                    CaseService.calculate_case_compensation(case)

                    # Create passenger account if it doesn't exist
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
            case = CaseStateService.mark_case_as_eligible(
                case,
                serializer.validated_data["is_eligible"],
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

class CaseAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return airassist_response.status_not_found_with_message("Case not found.")

        serializer = CaseAssignmentSerializer(data=request.data)
        airassist_response = AirAssistResponse()

        if not serializer.is_valid():
            return airassist_response.status_bad_request(serializer)

        try:
            colleague = User.objects.select_related("role").get(
                id=serializer.validated_data["colleague_id"]
            )
        except User.DoesNotExist:
            return airassist_response.status_not_found_with_message("Colleague not found.")


        try:
            case = CaseStateService.mark_case_as_assigned(case, colleague)
        except ValueError as exc:
            return airassist_response.status_bad_request_with_message(str(exc))

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