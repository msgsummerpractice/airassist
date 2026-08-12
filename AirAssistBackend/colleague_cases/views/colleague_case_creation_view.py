from django.db import transaction
from psycopg2 import DatabaseError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from case.services.case_service import CaseService

from ..permissions import IsColleague
from ..serializers.colleague_case_creation_serializer import ColleagueCaseCreationSerializer
from ..services.colleague_case_creation_service import ColleagueCaseCreationService


class ColleagueCaseCreationView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]
    parser_classes = [MultiPartParser, FormParser]

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
            except DatabaseError:
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
                    'message': 'Case created successfully.',
                    'data': {
                        'case_id': case.id,
                        'status': case.status,
                        'created_at': case.created_at,
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