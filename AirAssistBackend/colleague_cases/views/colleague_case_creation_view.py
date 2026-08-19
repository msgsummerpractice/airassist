from django.db import transaction
from psycopg2 import DatabaseError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.urls import reverse

from case.services.case_contract_service import CaseContractGenerationError, CaseContractService
from case.services.case_service import CaseService

from ..permissions import IsColleague
from ..serializers.colleague_case_creation_serializer import ColleagueCaseCreationSerializer
from ..services.colleague_case_creation_service import ColleagueCaseCreationService


class ColleagueCaseCreationView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        return Response(
            {
                'success': True,
                'data': ColleagueCaseCreationService.build_dashboard_payload(
                    request.user,
                )
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = ColleagueCaseCreationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    case = serializer.save()
                    case = ColleagueCaseCreationService.link_colleague_to_case(
                        case,
                        request.user,
                    )
                    CaseService.calculate_case_compensation(case)

                    passenger = case.passengers.first()
                    CaseService.create_passenger_account(passenger)

                    contract_document = CaseContractService.generate_for_case(
                        case,
                        uploaded_by="COLLEAGUE",
                    )
            except (DatabaseError, CaseContractGenerationError):
                return Response(
                    {
                        'success': False,
                        'message': 'Failed to save case. Please try again.'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response(
                {
                    'success': True,
                    'message': 'Case created successfully. Your contract PDF is ready for download.',
                    'data': {
                        'case_id': case.id,
                        'status': case.status,
                        'created_at': case.created_at,
                        'contract_document_id': contract_document.id,
                        'contract_download_url': request.build_absolute_uri(
                            reverse('case-contract-download', kwargs={'case_id': case.id})
                        ),
                    }
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                'success': False,
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )