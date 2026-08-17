from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger
from user.models.users import Role, User


class PassengerCaseDetailsApiTests(APITestCase):
    def setUp(self):
        self.passenger_role = Role.objects.create(role="PASSENGER")
        self.colleague_role = Role.objects.create(role="COLLEAGUE")

        self.passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="alice@example.com",
            password="testpass123",
            firstname="Alice",
            lastname="Passenger",
        )
        self.other_passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="bob@example.com",
            password="testpass123",
            firstname="Bob",
            lastname="Passenger",
        )
        self.colleague_user = User.objects.create_user(
            role=self.colleague_role,
            email="agent@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Agent",
        )

        self.owned_case = Case.objects.create(
            status=CaseState.ASSIGNED.value,
            gdpr_consent=True,
            assigned_colleague=self.colleague_user,
        )
        Passenger.objects.create(
            case=self.owned_case,
            first_name="Alice",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email="alice@example.com",
            phone="0712345678",
            address="Main Street 1",
            postal_code="010101",
        )
        Flight.objects.create(
            case=self.owned_case,
            flight_date="2026-08-03",
            flight_number="RO123",
            airline="Tarom",
            reservation_number="OWN123",
            departing_airport="OTP",
            destination_airport="FRA",
            planned_departure_time="10:00:00",
            planned_arrival_time="12:00:00",
            is_problem_flight=True,
            is_main_flight=True,
        )
        Flight.objects.create(
            case=self.owned_case,
            flight_date="2026-08-03",
            flight_number="RO456",
            airline="Tarom",
            reservation_number="OWN123",
            departing_airport="FRA",
            destination_airport="AMS",
            planned_departure_time="14:00:00",
            planned_arrival_time="15:30:00",
            is_problem_flight=False,
            is_main_flight=False,
        )
        CaseDocument.objects.create(
            case=self.owned_case,
            document_type=DocumentType.BOARDING_PASS.value,
            file=SimpleUploadedFile(
                "boarding-pass.pdf",
                b"dummy-pdf-content",
                content_type="application/pdf",
            ),
            original_filename="boarding-pass.pdf",
            content_type="application/pdf",
            file_size=17,
        )

        self.other_case = Case.objects.create(
            status=CaseState.NEW.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.other_case,
            first_name="Bob",
            last_name="Passenger",
            date_of_birth="1991-01-01",
            email="bob@example.com",
        )
        Flight.objects.create(
            case=self.other_case,
            flight_date="2026-08-04",
            flight_number="LH456",
            airline="Lufthansa",
            reservation_number="OTH456",
            departing_airport="CLJ",
            destination_airport="MUC",
            planned_departure_time="11:00:00",
            planned_arrival_time="13:00:00",
            is_problem_flight=True,
            is_main_flight=True,
        )

        self.url = f"/api/cases/me/{self.owned_case.id}/"

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbids_non_passenger_users(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_owned_case_details(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.owned_case.id)
        self.assertEqual(response.data["status"], CaseState.ASSIGNED.value)
        self.assertEqual(response.data["flight"]["flight_number"], "RO123")
        self.assertEqual(response.data["flight"]["reservation_number"], "OWN123")
        self.assertEqual(len(response.data["connecting_flights"]), 1)
        self.assertEqual(
            response.data["connecting_flights"][0]["flight_number"],
            "RO456",
        )
        self.assertEqual(response.data["passenger"]["first_name"], "Alice")
        self.assertEqual(response.data["passenger"]["email"], "alice@example.com")
        self.assertEqual(len(response.data["documents"]), 1)
        self.assertEqual(response.data["documents"][0]["filename"], "boarding-pass.pdf")
        self.assertIn("download_url", response.data["documents"][0])
        self.assertIn(
            f"/api/cases/me/{self.owned_case.id}/documents/",
            response.data["documents"][0]["download_url"],
        )

    def test_returns_not_found_for_other_passenger_case(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(f"/api/cases/me/{self.other_case.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)