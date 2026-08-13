from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.models.case import Case
from case.models.flights import Flight
from case.models.passengers import Passenger
from user.models.users import Role, User


class PassengerCaseListApiTests(APITestCase):
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

        self.url = "/api/cases/me/"

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbids_non_passenger_users(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_only_authenticated_passenger_cases(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.owned_case.id)
        self.assertEqual(response.data[0]["flight_number"], "RO123")
        self.assertEqual(response.data[0]["passenger_name"], "Alice Passenger")
        self.assertEqual(response.data[0]["status"], CaseState.ASSIGNED.value)
        self.assertEqual(response.data[0]["assignee"], "Case Agent")

    def test_does_not_leak_other_passenger_cases(self):
        self.client.force_authenticate(user=self.other_passenger_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.other_case.id)

    def test_filters_by_status(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(f"{self.url}?status=assigned")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_sorts_by_id(self):
        second_case = Case.objects.create(
            status=CaseState.NEW.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=second_case,
            first_name="Alice",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email="alice@example.com",
        )
        Flight.objects.create(
            case=second_case,
            flight_date="2026-08-05",
            flight_number="W4321",
            airline="Wizz Air",
            reservation_number="OWN999",
            departing_airport="OTP",
            destination_airport="BCN",
            planned_departure_time="14:00:00",
            planned_arrival_time="17:00:00",
            is_problem_flight=True,
            is_main_flight=True,
        )

        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(f"{self.url}?ordering=id")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [self.owned_case.id, second_case.id])