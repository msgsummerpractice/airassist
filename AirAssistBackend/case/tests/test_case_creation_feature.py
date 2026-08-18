import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from case.enums.cancellation_type_enum import CancellationType
from case.enums.case_state_enum import CaseState
from case.enums.delay_type_enum import DelayType
from case.enums.denied_boarding_type_enum import DeniedBoardingType
from case.enums.disruption_type_enum import DisruptionMotive
from case.models.case import Case
from case.models.disruption import Disruption
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger
from case.serializers.case_creation_serializer import CaseCreationSerializer
from case.services.case_service import CaseService
from user.models.users import Role, User

ELIGIBLE_DELAY_DISRUPTION = {
    "motive": DisruptionMotive.DELAY.value,
    "delay_type": DelayType.MORE_THAN_3_HOURS.value,
}

INELIGIBLE_DELAY_DISRUPTION = {
    "motive": DisruptionMotive.DELAY.value,
    "delay_type": DelayType.LESS_THAN_3_HOURS.value,
}

ELIGIBLE_CANCELLATION_DISRUPTION = {
    "motive": DisruptionMotive.CANCELATION.value,
    "cancellation_type": CancellationType.ON_FLIGHT_DAY.value,
    "delay_type": DelayType.MORE_THAN_3_HOURS.value,
}

INELIGIBLE_CANCELLATION_DISRUPTION = {
    "motive": DisruptionMotive.CANCELATION.value,
    "cancellation_type": CancellationType.MORE_THAN_14_DAYS.value,
}

ELIGIBLE_DENIED_BOARDING_DISRUPTION = {
    "motive": DisruptionMotive.DENIED_BOARDING.value,
    "denied_boarding_type": DeniedBoardingType.NO.value,
    "delay_type": DelayType.MORE_THAN_3_HOURS.value,
}


def _pdf():
    return SimpleUploadedFile("doc.pdf", b"PDF content", content_type="application/pdf")


def _jpg():
    return SimpleUploadedFile("doc.jpg", b"JPG content", content_type="image/jpeg")


def _build_serializer_payload(**overrides):
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
        "is_main_flight": True,
        "first_name": "Ada",
        "last_name": "Lovelace",
        "date_of_birth": "1990-01-01",
        "email": "ada@example.com",
        "phone": "1234567890",
        "address": "Main Street 1",
        "postal_code": "12345",
        "boarding_pass": _pdf(),
        "passport": _jpg(),
        "gdpr_consent": True,
        "disruption": json.dumps(ELIGIBLE_DELAY_DISRUPTION),
    }
    payload.update(overrides)
    return payload


class PassengerAccountCreationTests(TestCase):
    @patch("user.service.user_service.send_user_created_email")
    def test_creates_passenger_role_when_it_has_not_been_seeded(self, _mock_email):
        case = Case.objects.create(gdpr_consent=True)
        passenger = Passenger.objects.create(
            case=case,
            first_name="Ada",
            last_name="Lovelace",
            date_of_birth="1990-01-01",
            email="ada@example.com",
        )

        CaseService.create_passenger_account(passenger)

        self.assertTrue(Role.objects.filter(role="PASSENGER").exists())
        self.assertTrue(User.objects.filter(email="ada@example.com").exists())


# ---------------------------------------------------------------------------
# Serializer-level validation tests
# ---------------------------------------------------------------------------

class CaseCreationSerializerValidationTests(TestCase):

    def test_valid_payload_is_accepted(self):
        s = CaseCreationSerializer(data=_build_serializer_payload())
        self.assertTrue(s.is_valid(), s.errors)

    # --- required fields ---

    def test_rejects_missing_disruption(self):
        payload = _build_serializer_payload()
        payload.pop("disruption")
        s = CaseCreationSerializer(data=payload)
        self.assertFalse(s.is_valid())
        self.assertIn("disruption", s.errors)

    def test_rejects_missing_email(self):
        payload = _build_serializer_payload()
        payload.pop("email")
        s = CaseCreationSerializer(data=payload)
        self.assertFalse(s.is_valid())
        self.assertIn("email", s.errors)

    def test_rejects_missing_boarding_pass(self):
        payload = _build_serializer_payload()
        payload.pop("boarding_pass")
        s = CaseCreationSerializer(data=payload)
        self.assertFalse(s.is_valid())
        self.assertIn("boarding_pass", s.errors)

    def test_rejects_missing_passport(self):
        payload = _build_serializer_payload()
        payload.pop("passport")
        s = CaseCreationSerializer(data=payload)
        self.assertFalse(s.is_valid())
        self.assertIn("passport", s.errors)

    # --- GDPR ---

    def test_rejects_gdpr_consent_false(self):
        s = CaseCreationSerializer(data=_build_serializer_payload(gdpr_consent=False))
        self.assertFalse(s.is_valid())
        self.assertIn("gdpr_consent", s.errors)

    # --- date of birth ---

    def test_rejects_future_date_of_birth(self):
        s = CaseCreationSerializer(data=_build_serializer_payload(date_of_birth="2099-01-01"))
        self.assertFalse(s.is_valid())
        self.assertIn("date_of_birth", s.errors)

    def test_rejects_today_as_date_of_birth(self):
        from django.utils import timezone
        today = timezone.now().date().isoformat()
        s = CaseCreationSerializer(data=_build_serializer_payload(date_of_birth=today))
        self.assertFalse(s.is_valid())
        self.assertIn("date_of_birth", s.errors)

    # --- document validation ---

    def test_rejects_file_with_disallowed_extension(self):
        bad_file = SimpleUploadedFile("doc.exe", b"content", content_type="application/octet-stream")
        s = CaseCreationSerializer(data=_build_serializer_payload(boarding_pass=bad_file))
        self.assertFalse(s.is_valid())
        self.assertIn("boarding_pass", s.errors)

    def test_rejects_boarding_pass_exceeding_5_mb(self):
        big_file = SimpleUploadedFile("doc.pdf", b"a" * (5 * 1024 * 1024 + 1), content_type="application/pdf")
        s = CaseCreationSerializer(data=_build_serializer_payload(boarding_pass=big_file))
        self.assertFalse(s.is_valid())
        self.assertIn("boarding_pass", s.errors)

    def test_rejects_passport_exceeding_5_mb(self):
        big_file = SimpleUploadedFile("doc.jpg", b"a" * (5 * 1024 * 1024 + 1), content_type="image/jpeg")
        s = CaseCreationSerializer(data=_build_serializer_payload(passport=big_file))
        self.assertFalse(s.is_valid())
        self.assertIn("passport", s.errors)

    # --- disruption JSON ---

    def test_rejects_disruption_as_non_json_string(self):
        s = CaseCreationSerializer(data=_build_serializer_payload(disruption="not-json"))
        self.assertFalse(s.is_valid())
        self.assertIn("disruption", s.errors)

    def test_rejects_disruption_as_json_array_instead_of_object(self):
        s = CaseCreationSerializer(data=_build_serializer_payload(disruption=json.dumps([])))
        self.assertFalse(s.is_valid())
        self.assertIn("disruption", s.errors)

    def test_rejects_disruption_with_invalid_motive(self):
        bad = {"motive": "UNKNOWN_MOTIVE"}
        s = CaseCreationSerializer(data=_build_serializer_payload(disruption=json.dumps(bad)))
        self.assertFalse(s.is_valid())
        self.assertIn("disruption", s.errors)

    # --- problem-flight logic ---

    def test_rejects_no_problem_flight_marked(self):
        s = CaseCreationSerializer(data=_build_serializer_payload(is_problem_flight=False))
        self.assertFalse(s.is_valid())
        self.assertIn("non_field_errors", s.errors)

    def test_rejects_more_than_one_problem_flight(self):
        connection = [
            {
                "flight_number": "LH456",
                "flight_date": "2026-08-03",
                "airline": "Lufthansa",
                "reservation_number": "ABC123",
                "departing_airport": "OTP",
                "destination_airport": "FRA",
                "planned_departure_time": "2026-08-03T12:30:00Z",
                "planned_arrival_time": "2026-08-03T14:30:00Z",
                "is_problem_flight": True,
                "is_main_flight": False,
            }
        ]
        # main flight is also problem flight → two problem flights total
        s = CaseCreationSerializer(
            data=_build_serializer_payload(
                is_problem_flight=True,
                connection_flights=json.dumps(connection),
            )
        )
        self.assertFalse(s.is_valid())
        self.assertIn("non_field_errors", s.errors)

    # --- connection-flight chain ---

    def test_rejects_connection_flight_missing_required_fields(self):
        incomplete = [{"flight_number": "LH456", "flight_date": "2026-08-03"}]
        s = CaseCreationSerializer(
            data=_build_serializer_payload(
                is_problem_flight=False,
                connection_flights=json.dumps(incomplete),
            )
        )
        self.assertFalse(s.is_valid())
        self.assertIn("connection_flights", s.errors)

    def test_rejects_more_than_4_connection_flights(self):
        flight_template = {
            "flight_number": "LH456",
            "flight_date": "2026-08-03",
            "airline": "Lufthansa",
            "reservation_number": "ABC123",
            "departing_airport": "OTP",
            "destination_airport": "FRA",
            "planned_departure_time": "2026-08-03T12:30:00Z",
            "planned_arrival_time": "2026-08-03T14:30:00Z",
            "is_problem_flight": False,
            "is_main_flight": False,
        }
        five_flights = [dict(flight_template) for _ in range(5)]
        s = CaseCreationSerializer(data=_build_serializer_payload(connection_flights=json.dumps(five_flights)))
        self.assertFalse(s.is_valid())
        self.assertIn("connection_flights", s.errors)

    def test_rejects_connection_flights_as_non_json(self):
        s = CaseCreationSerializer(data=_build_serializer_payload(connection_flights="not-a-list"))
        self.assertFalse(s.is_valid())
        self.assertIn("connection_flights", s.errors)


# ---------------------------------------------------------------------------
# Case creation endpoint tests  POST /api/cases/
# ---------------------------------------------------------------------------

def _api_payload(**overrides):
    """Build a multipart-ready payload for the DRF test client."""
    payload = _build_serializer_payload(**overrides)
    return payload


class CaseCreationViewTests(TestCase):

    CREATE_URL = reverse("case-create")

    def setUp(self):
        from user.enums.roles import Roles
        from user.models.users import Role

        Role.objects.create(role=Roles.PASSENGER.value)

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_happy_path_creates_all_records(self, _mock_dist, _mock_email):
        self.assertEqual(Case.objects.count(), 0)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("case_id", data["data"])
        self.assertIn("status", data["data"])

        # DB assertions
        self.assertEqual(Case.objects.count(), 1)
        case = Case.objects.first()
        self.assertEqual(Disruption.objects.filter(case=case).count(), 1)
        self.assertEqual(Flight.objects.filter(case=case).count(), 1)
        self.assertEqual(Passenger.objects.filter(case=case).count(), 1)
        self.assertEqual(CaseDocument.objects.filter(case=case).count(), 3)

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_case_status_is_valid_after_creation(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        self.assertEqual(case.status, CaseState.PENDING.value)

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_case_has_correct_gdpr_fields(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        self.assertTrue(case.gdpr_consent)
        self.assertIsNotNone(case.gdpr_consent_at)

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_case_has_correct_airports(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        self.assertEqual(case.departure_airport, "OTP")
        self.assertEqual(case.arrival_airport, "FRA")

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_passenger_linked_to_case(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        passenger = Passenger.objects.filter(case=case).first()
        self.assertIsNotNone(passenger)
        self.assertEqual(passenger.first_name, "Ada")
        self.assertEqual(passenger.last_name, "Lovelace")
        self.assertEqual(passenger.email, "ada@example.com")

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_flight_linked_to_case_with_correct_fields(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        flight = Flight.objects.filter(case=case).first()
        self.assertIsNotNone(flight)
        self.assertEqual(flight.flight_number, "LH123")
        self.assertTrue(flight.is_main_flight)
        self.assertTrue(flight.is_problem_flight)

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_compensation_set_on_case(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        self.assertIsNotNone(case.compensation_amount)
        self.assertIsNotNone(case.distance_km)

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_case_documents_and_contract_are_created(self, _mock_dist, _mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        case = Case.objects.first()
        doc_types = list(CaseDocument.objects.filter(case=case).values_list("document_type", flat=True))
        self.assertEqual(len(doc_types), 3)
        self.assertIn("BOARDING_PASS", doc_types)
        self.assertIn("PASSPORT", doc_types)
        self.assertIn("CONTRACT", doc_types)

    # --- ineligible disruption ---

    def test_ineligible_disruption_returns_400_and_no_case_created(self):
        payload = _api_payload(disruption=json.dumps(INELIGIBLE_DELAY_DISRUPTION))
        response = self.client.post(self.CREATE_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
        self.assertEqual(Case.objects.count(), 0)

    def test_ineligible_cancellation_returns_400(self):
        payload = _api_payload(disruption=json.dumps(INELIGIBLE_CANCELLATION_DISRUPTION))
        response = self.client.post(self.CREATE_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Case.objects.count(), 0)

    # --- invalid payload ---

    def test_invalid_payload_returns_400_and_no_case_created(self):
        payload = _api_payload()
        payload.pop("gdpr_consent")
        response = self.client.post(self.CREATE_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
        self.assertIn("errors", response.json())
        self.assertEqual(Case.objects.count(), 0)

    def test_missing_boarding_pass_returns_400(self):
        payload = _api_payload()
        payload.pop("boarding_pass")
        response = self.client.post(self.CREATE_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Case.objects.count(), 0)

    # --- email service ---

    @patch("case.views.case_creation_view.send_basic_email")
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_confirmation_email_sent_to_passenger_after_commit(self, _mock_dist, mock_email):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")

        mock_email.assert_called_once()
        call_kwargs = mock_email.call_args
        self.assertEqual(call_kwargs.kwargs.get("to_email") or call_kwargs.args[0], "ada@example.com")

    @patch("case.views.case_creation_view.send_basic_email", side_effect=Exception("SMTP error"))
    @patch("case.services.case_service.DistanceService.calculate_orthodromic_distance", return_value=1200.0)
    def test_email_failure_does_not_roll_back_case(self, _mock_dist, _mock_email):
        # Email is fired after transaction.on_commit; a failure there must not
        # affect the already-committed case record.
        try:
            with self.captureOnCommitCallbacks(execute=True):
                self.client.post(self.CREATE_URL, data=_api_payload(), format="multipart")
        except Exception:
            pass

        self.assertEqual(Case.objects.count(), 1)


# ---------------------------------------------------------------------------
# Eligibility check endpoint tests  POST /api/cases/eligibility-check/
# ---------------------------------------------------------------------------

class CaseEligibilityViewTests(TestCase):

    ELIGIBILITY_URL = reverse("case-eligibility-check")

    def test_eligible_delay_returns_is_eligible_true(self):
        payload = _api_payload(disruption=json.dumps(ELIGIBLE_DELAY_DISRUPTION))
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_eligible"])
        self.assertIsNone(data["reason"])

    def test_ineligible_delay_returns_is_eligible_false_with_reason(self):
        payload = _api_payload(disruption=json.dumps(INELIGIBLE_DELAY_DISRUPTION))
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["is_eligible"])
        self.assertIsNotNone(data["reason"])

    def test_eligible_cancellation_returns_is_eligible_true(self):
        payload = _api_payload(disruption=json.dumps(ELIGIBLE_CANCELLATION_DISRUPTION))
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_eligible"])

    def test_ineligible_cancellation_more_than_14_days_returns_false(self):
        payload = _api_payload(disruption=json.dumps(INELIGIBLE_CANCELLATION_DISRUPTION))
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["is_eligible"])
        self.assertIn("14", data["reason"])

    def test_eligible_denied_boarding_returns_true(self):
        payload = _api_payload(disruption=json.dumps(ELIGIBLE_DENIED_BOARDING_DISRUPTION))
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_eligible"])

    def test_ineligible_denied_boarding_voluntary_returns_false(self):
        disruption = {
            "motive": DisruptionMotive.DENIED_BOARDING.value,
            "denied_boarding_type": DeniedBoardingType.YES.value,
            "delay_type": DelayType.MORE_THAN_3_HOURS.value,
        }
        payload = _api_payload(disruption=json.dumps(disruption))
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["is_eligible"])

    def test_invalid_payload_returns_400_with_errors_key(self):
        payload = _api_payload()
        payload.pop("gdpr_consent")
        response = self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
        self.assertIn("errors", response.json())

    def test_eligibility_check_does_not_create_any_db_records(self):
        payload = _api_payload(disruption=json.dumps(ELIGIBLE_DELAY_DISRUPTION))
        self.client.post(self.ELIGIBILITY_URL, data=payload, format="multipart")

        self.assertEqual(Case.objects.count(), 0)
        self.assertEqual(Disruption.objects.count(), 0)
        self.assertEqual(Flight.objects.count(), 0)
        self.assertEqual(Passenger.objects.count(), 0)
