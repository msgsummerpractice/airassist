import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from airports.models.airport import Airport
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.flights import Flight
from user.enums.roles import Roles
from user.models.users import Role, User

from colleague_cases.services.colleague_case_creation_service import ColleagueCaseCreationService


class ColleagueCaseCreationViewTests(APITestCase):
    def setUp(self):
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)
        self.passenger_role = Role.objects.create(role=Roles.PASSENGER.value)
        self.colleague = User.objects.create_user(
            role=self.colleague_role,
            email='colleague@example.com',
            password='testpass123',
            firstname='Case',
            lastname='Worker',
        )
        self.passenger = User.objects.create_user(
            role=self.passenger_role,
            email='passenger@example.com',
            password='testpass123',
            firstname='Normal',
            lastname='User',
        )
        Airport.objects.create(
            iata='OTP',
            name='OTP Airport',
            timezone='Europe/Bucharest',
        )
        Airport.objects.create(
            iata='FRA',
            name='FRA Airport',
            timezone='Europe/Berlin',
        )

    def build_payload(self, email='colleague@example.com'):
        return {
            'flight_date': '2026-08-03',
            'flight_number': 'LH123',
            'airline': 'Lufthansa',
            'reservation_number': 'ABC123',
            'departing_airport': 'OTP',
            'destination_airport': 'FRA',
            'connection_flights': json.dumps([]),
            'planned_departure_time': '2026-08-03T10:00:00Z',
            'planned_arrival_time': '2026-08-03T12:00:00Z',
            'is_problem_flight': True,
            'is_main_flight': True,
            'first_name': 'Ada',
            'last_name': 'Lovelace',
            'date_of_birth': '1990-01-01',
            'email': email,
            'phone': '1234567890',
            'address': 'Main Street 1',
            'postal_code': '12345',
            'boarding_pass': SimpleUploadedFile('boarding-pass.pdf', b'file', content_type='application/pdf'),
            'passport': SimpleUploadedFile('passport.jpg', b'file', content_type='image/jpeg'),
            'gdpr_consent': True,
            'disruption': json.dumps({
                'motive': 'DELAY',
                'delay_type': 'MORE_THAN_3_HOURS',
            }),
        }

    @patch('colleague_cases.views.colleague_case_creation_view.CaseService.create_passenger_account')
    @patch('colleague_cases.views.colleague_case_creation_view.CaseService.calculate_case_compensation')
    def test_authenticated_colleague_can_create_case(self, calculate_case_compensation, create_passenger_account):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.post('/api/cases/colleague/', data=self.build_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('ready for download', response.data['message'])
        self.assertIn('contract_download_url', response.data['data'])
        self.assertEqual(Case.objects.count(), 1)
        self.assertEqual(Flight.objects.count(), 1)
        self.assertEqual(
            CaseDocument.objects.filter(document_type=DocumentType.CONTRACT.value).count(),
            1,
        )
        created_case = Case.objects.get()
        self.assertEqual(created_case.assigned_colleague, self.colleague)

        contract_document = CaseDocument.objects.get(
            document_type=DocumentType.CONTRACT.value,
        )
        self.assertTrue(contract_document.original_filename.endswith('.pdf'))

        download_response = self.client.get(
            f"/api/cases/{response.data['data']['case_id']}/contract/"
        )

        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response.get('Content-Type'), 'application/pdf')
        self.assertIn('attachment;', download_response.get('Content-Disposition'))
        self.assertTrue(b''.join(download_response.streaming_content).startswith(b'%PDF'))
        calculate_case_compensation.assert_called_once()
        create_passenger_account.assert_called_once()

    @patch('colleague_cases.views.colleague_case_creation_view.CaseContractService.generate_for_case')
    @patch('colleague_cases.views.colleague_case_creation_view.CaseService.create_passenger_account')
    @patch('colleague_cases.views.colleague_case_creation_view.CaseService.calculate_case_compensation')
    def test_returns_500_when_contract_generation_fails(
        self,
        calculate_case_compensation,
        create_passenger_account,
        generate_for_case,
    ):
        from case.services.case_contract_service import CaseContractGenerationError

        self.client.force_authenticate(user=self.colleague)
        generate_for_case.side_effect = CaseContractGenerationError('boom')

        response = self.client.post('/api/cases/colleague/', data=self.build_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data['success'])
        self.assertEqual(
            CaseDocument.objects.filter(document_type=DocumentType.CONTRACT.value).count(),
            0,
        )
        calculate_case_compensation.assert_called_once()
        create_passenger_account.assert_called_once()

    def test_non_colleague_cannot_create_case(self):
        self.client.force_authenticate(user=self.passenger)

        response = self.client.post('/api/cases/colleague/', data=self.build_payload(email='passenger@example.com'), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Case.objects.count(), 0)

    def test_link_colleague_to_case_assigns_creator(self):
        case = Case.objects.create(gdpr_consent=True)

        linked_case = ColleagueCaseCreationService.link_colleague_to_case(
            case,
            self.colleague,
        )

        self.assertEqual(linked_case.assigned_colleague, self.colleague)

    def test_link_colleague_to_case_rejects_non_colleague(self):
        case = Case.objects.create(gdpr_consent=True)

        with self.assertRaisesMessage(ValueError, 'Only colleagues can be linked to a case.'):
            ColleagueCaseCreationService.link_colleague_to_case(
                case,
                self.passenger,
            )