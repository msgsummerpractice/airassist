import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from case.models.case_models import Case
from case.models.case_state import CaseState
from case.models.flights_models import Flight
from case.serializers import CaseCreationSerializer
from case.services.case_state_service import CaseStateService


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
	def test_assign_requires_valid_case(self):
		case = Case.objects.create(gdpr_consent=True)

		with self.assertRaises(ValueError):
			CaseStateService.assign_case(case)

	def test_set_eligibility_marks_case_valid(self):
		case = Case.objects.create(gdpr_consent=True)

		updated_case = CaseStateService.set_eligibility(case, is_eligible=True)

		self.assertEqual(updated_case.status, CaseState.VALID.value)
