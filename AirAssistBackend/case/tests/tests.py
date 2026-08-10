import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from AirAssistBackend.case.models.case import Case
from AirAssistBackend.case.enums.case_state_enum import CaseState
from AirAssistBackend.case.models.flights import Flight
from AirAssistBackend.case.serilizers.serializers import CaseCreationSerializer
from case.services.case_state_service import CaseStateService
from user.models.models import Role, User


class CaseCreationSerializerTests(TestCase):
	def build_payload(self, **overrides):
		payload = {
			"flight_date": "2026-08-03",
			"flight_number": "LH123",
			"airline": "Lufthansa",
			"reservation_number": "ABC123",
			"departing_airport": "OTP",
			"destination_airport": "FRA",
			"connection_flights": json.dumps([]),
			"planned_departure_time": "2026-08-03T10:00:00Z",
			"planned_arrival_time": "2026-08-03T12:00:00Z",
			"is_problem_flight": True,
			"first_name": "Ada",
			"last_name": "Lovelace",
			"date_of_birth": "1990-01-01",
			"email": "ada@example.com",
			"phone": "1234567890",
			"address": "Main Street 1",
			"postal_code": "12345",
			"boarding_pass": SimpleUploadedFile("boarding-pass.pdf", b"file", content_type="application/pdf"),
			"passport": SimpleUploadedFile("passport.jpg", b"file", content_type="image/jpeg"),
			"gdpr_consent": True,
		}
		payload.update(overrides)
		return payload

	def test_rejects_file_larger_than_five_mb(self):
		large_file = SimpleUploadedFile(
			"boarding-pass.pdf",
			b"a" * (5 * 1024 * 1024 + 1),
			content_type="application/pdf",
		)
		serializer = CaseCreationSerializer(
			data=self.build_payload(boarding_pass=large_file)
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn("boarding_pass", serializer.errors)

	def test_rejects_missing_gdpr_consent(self):
		serializer = CaseCreationSerializer(
			data=self.build_payload(gdpr_consent=False)
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn("gdpr_consent", serializer.errors)

	def test_rejects_connection_flight_missing_required_fields(self):
		connection_flights = json.dumps([
			{
				"flight_number": "LH456",
				"flight_date": "2026-08-03",
				"planned_departure_time": "2026-08-03T12:30:00Z",
				"planned_arrival_time": "2026-08-03T14:30:00Z",
				"is_problem_flight": False,
			}
		])
		serializer = CaseCreationSerializer(
			data=self.build_payload(connection_flights=connection_flights)
		)

		self.assertFalse(serializer.is_valid())
		self.assertIn("connection_flights", serializer.errors)

	def test_creates_case_and_main_flight(self):
		serializer = CaseCreationSerializer(data=self.build_payload())

		self.assertTrue(serializer.is_valid(), serializer.errors)
		case = serializer.save()

		self.assertEqual(case.status, CaseState.NEW.value)
		self.assertEqual(Case.objects.count(), 1)
		self.assertEqual(Flight.objects.count(), 1)
		self.assertTrue(case.gdpr_consent)
		self.assertIsNotNone(case.gdpr_consent_at)


class CaseStateServiceTests(TestCase):
    def setUp(self):
        self.colleague_role = Role.objects.create(role="Colleague")

    def test_new_case_can_be_marked_valid(self):
        case = Case.objects.create(gdpr_consent=True)

        updated_case = CaseStateService.mark_case_as_valid(case)

        self.assertEqual(updated_case.status, CaseState.VALID.value)

    def test_new_case_can_be_marked_invalid(self):
        case = Case.objects.create(gdpr_consent=True)

        updated_case = CaseStateService.mark_case_as_invalid(case)

        self.assertEqual(updated_case.status, CaseState.INVALID.value)

    def test_assign_requires_valid_case(self):
        colleague = User.objects.create_user(
            role=self.colleague_role,
            email="colleague@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Worker",
        )
        case = Case.objects.create(gdpr_consent=True)

        with self.assertRaises(ValueError):
            CaseStateService.mark_case_as_assigned(case, colleague)

    def test_valid_case_can_be_assigned(self):
        colleague = User.objects.create_user(
            role=self.colleague_role,
            email="colleague2@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Reviewer",
        )
        case = Case.objects.create(
            gdpr_consent=True,
            status=CaseState.VALID.value,
        )

        updated_case = CaseStateService.mark_case_as_assigned(case, colleague)

        self.assertEqual(updated_case.status, CaseState.ASSIGNED.value)
        self.assertEqual(updated_case.assigned_colleague, colleague)

    def test_only_new_case_can_be_checked_for_eligibility(self):
        case = Case.objects.create(
            gdpr_consent=True,
            status=CaseState.VALID.value,
        )

        with self.assertRaises(ValueError):
            CaseStateService.mark_case_as_eligible(case, is_eligible=True)
