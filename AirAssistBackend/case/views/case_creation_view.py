from django.db import transaction
from psycopg2 import DatabaseError
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.urls import reverse

from case.models.disruption import Disruption
from case_email.services.email_service import send_case_registered_email

from ..serializers.case_creation_serializer import CaseCreationSerializer
from ..services.case_contract_service import CaseContractGenerationError, CaseContractService
from ..services.case_service import CaseService
from ..services.case_eligibility_service import CaseEligibilityService
from ..services.case_state_service import CaseStateService


class CaseCreationView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

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

        disruption_data = serializer.validated_data["disruption"]
        disruption_probe = Disruption(**disruption_data)
        is_eligible = CaseEligibilityService.check_disruption_eligibility(
            disruption_probe)

        if not is_eligible:
            return Response(
                {
                    "success": False,
                    "message": "Case is NOT eligible for submission."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                case = serializer.save()

                CaseService.calculate_case_compensation(case)

                passenger = case.passengers.first()
                CaseService.create_passenger_account(passenger)

                contract_document = CaseContractService.generate_for_case(case)

                if passenger and passenger.email:
                    registered_passenger = passenger
                    registered_case = case
                    registered_contract_document = contract_document

                    def _send_case_registered_email():
                        send_case_registered_email(
                            registered_passenger,
                            registered_case,
                            registered_contract_document,
                        )

                    transaction.on_commit(_send_case_registered_email)

        except (DatabaseError, CaseContractGenerationError):
            return Response(
                {
                    "success": False,
                    "message": "Failed to save case. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except ValueError as exc:
            return Response(
                {
                    "success": False,
                    "message": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "success": True,
                "message": "Case created successfully. Your contract PDF is ready for download.",
                "data": {
                    "case_id": case.id,
                    "status": case.status,
                    "created_at": case.created_at,
                    "contract_document_id": contract_document.id,
                    "passenger_email": passenger.email if passenger else None,
                    "contract_download_url": request.build_absolute_uri(
                        reverse("case-contract-download",
                                kwargs={"case_id": case.id})
                    ),
                }
            },
            status=status.HTTP_201_CREATED
        )
