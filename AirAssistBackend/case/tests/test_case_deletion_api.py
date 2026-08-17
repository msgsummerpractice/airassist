from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.models.case import Case
from case.models.comment import Comment
from case.models.disruption import Disruption
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger
from user.models.users import Role, User


class CaseDeletionApiTests(APITestCase):
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
        self.document = CaseDocument.objects.create(
            case=self.case,
            document_type="OTHER",
            file=ContentFile(b"case document", name="case-delete-test.pdf"),
            original_filename="case-delete-test.pdf",
            content_type="application/pdf",
            file_size=13,
        )
        self.document_file_name = self.document.file.name
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
        Comment.objects.create(
            case=self.case,
            author=self.colleague,
            text="Case comment",
        )
        Disruption.objects.create(case=self.case, motive="DELAY")
        self.url = f"/api/cases/admin/{self.case.id}/"

    def test_requires_authentication(self):
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Case.objects.filter(pk=self.case.id).exists())

    def test_forbids_non_system_administrator(self):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Case.objects.filter(pk=self.case.id).exists())

    def test_deletes_case_dependents_and_document_file(self):
        self.client.force_authenticate(user=self.system_admin)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Case deleted successfully.")
        self.assertEqual(response.data["data"]["case_id"], self.case.id)
        self.assertFalse(Case.objects.filter(pk=self.case.id).exists())
        self.assertFalse(Flight.objects.filter(case_id=self.case.id).exists())
        self.assertFalse(Passenger.objects.filter(case_id=self.case.id).exists())
        self.assertFalse(Comment.objects.filter(case_id=self.case.id).exists())
        self.assertFalse(Disruption.objects.filter(case_id=self.case.id).exists())
        self.assertFalse(CaseDocument.objects.filter(case_id=self.case.id).exists())
        self.assertFalse(self.document.file.storage.exists(self.document_file_name))

    def test_returns_not_found_for_missing_case(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.delete("/api/cases/admin/999999/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["message"], "Case not found.")