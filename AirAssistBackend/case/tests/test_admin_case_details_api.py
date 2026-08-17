from rest_framework import status
from rest_framework.test import APITestCase

from case.models.case import Case
from case.models.flights import Flight
from case.models.passengers import Passenger
from user.models.users import Role, User


class AdminCaseDetailsApiTests(APITestCase):
    def setUp(self):
        self.system_admin_role = Role.objects.create(role="SYSTEM_ADMIN")
        self.colleague_role = Role.objects.create(role="COLLEAGUE")
        self.system_admin = User.objects.create_user(
            role=self.system_admin_role,
            email="admin@example.com",
            password="testpass123",
            firstname="System",
            lastname="Admin",
        )
        self.colleague = User.objects.create_user(
            role=self.colleague_role,
            email="colleague@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Colleague",
        )
        self.case = Case.objects.create(gdpr_consent=True)
        Flight.objects.create(
            case=self.case,
            flight_date="2026-08-17",
            flight_number="RO123",
            airline="Tarom",
            reservation_number="ABC123",
            departing_airport="OTP",
            destination_airport="FRA",
            planned_departure_time="10:00:00",
            planned_arrival_time="12:00:00",
            is_main_flight=True,
        )
        Passenger.objects.create(
            case=self.case,
            first_name="Ada",
            last_name="Lovelace",
            date_of_birth="1990-01-01",
            email="ada@example.com",
        )
        self.url = f"/api/cases/admin/{self.case.id}/"

    def test_requires_system_administrator(self):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_case_details_for_system_administrator(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.case.id)
        self.assertEqual(response.data["flight"]["flight_number"], "RO123")
        self.assertEqual(response.data["passenger"]["email"], "ada@example.com")