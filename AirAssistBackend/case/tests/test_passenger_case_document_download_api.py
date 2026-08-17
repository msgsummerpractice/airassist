from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.passengers import Passenger
from user.models.users import Role, User


class PassengerCaseDocumentDownloadApiTests(APITestCase):
    def setUp(self):
        passenger_role = Role.objects.create(role="PASSENGER")
        colleague_role = Role.objects.create(role="COLLEAGUE")

        self.passenger_user = User.objects.create_user(
            role=passenger_role,
            email="alice@example.com",
            password="testpass123",
            firstname="Alice",
            lastname="Passenger",
        )
        self.other_passenger_user = User.objects.create_user(
            role=passenger_role,
            email="bob@example.com",
            password="testpass123",
            firstname="Bob",
            lastname="Passenger",
        )
        self.colleague_user = User.objects.create_user(
            role=colleague_role,
            email="agent@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Agent",
        )

        self.owned_case = Case.objects.create(
            status=CaseState.ASSIGNED.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.owned_case,
            first_name="Alice",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email="alice@example.com",
        )
        self.owned_document = CaseDocument.objects.create(
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
        self.other_document = CaseDocument.objects.create(
            case=self.other_case,
            document_type=DocumentType.PASSPORT.value,
            file=SimpleUploadedFile(
                "passport.jpg",
                b"dummy-image-content",
                content_type="image/jpeg",
            ),
            original_filename="passport.jpg",
            content_type="image/jpeg",
            file_size=19,
        )

        self.url = (
            f"/api/cases/me/{self.owned_case.id}/documents/"
            f"{self.owned_document.id}/download/"
        )

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbids_non_passenger_users(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_downloads_owned_document(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/pdf")
        self.assertIn("attachment;", response.get("Content-Disposition"))
        self.assertIn("boarding-pass.pdf", response.get("Content-Disposition"))
        self.assertEqual(b"".join(response.streaming_content), b"dummy-pdf-content")

    def test_returns_not_found_for_document_from_other_case(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(
            f"/api/cases/me/{self.other_case.id}/documents/{self.other_document.id}/download/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)