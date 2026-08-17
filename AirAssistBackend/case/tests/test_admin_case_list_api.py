from rest_framework import status
from rest_framework.test import APITestCase

from case.models.case import Case
from case.models.flights import Flight
from user.models.users import Role, User


class AdminCaseListApiTests(APITestCase):
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
        self.url = "/api/cases/admin/"

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbids_non_system_administrator(self):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_all_cases_with_required_list_fields(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(
            response.data["data"][0],
            {
                "id": self.case.id,
                "case_date": self.case.created_at.isoformat().replace("+00:00", "Z"),
                "flight_number": "RO123",
                "flight_date": "2026-08-17",
                "status": "NEW",
            },
        )