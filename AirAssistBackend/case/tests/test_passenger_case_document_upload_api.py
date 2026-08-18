from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.passengers import Passenger
from user.models.users import Role, User


class PassengerCaseDocumentUploadApiTests(APITestCase):
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
            status=CaseState.IN_REVIEW.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.owned_case,
            first_name="Alice",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email="alice@example.com",
        )

        self.other_case = Case.objects.create(
            status=CaseState.PENDING.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.other_case,
            first_name="Bob",
            last_name="Passenger",
            date_of_birth="1991-01-01",
            email="bob@example.com",
        )

        self.upload_url = reverse(
            "passenger-case-document-upload",
            kwargs={"pk": self.owned_case.pk},
        )

    def _pdf_file(self, name="evidence.pdf", content=b"%PDF-1.4 test"):
        return SimpleUploadedFile(name, content, content_type="application/pdf")

    def test_upload_requires_authentication(self):
        response = self.client.post(
            self.upload_url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.BOARDING_PASS.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_forbids_non_passenger_users(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(
            self.upload_url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.BOARDING_PASS.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_creates_document_for_owned_case(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(
            self.upload_url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.BOARDING_PASS.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseDocument.objects.count(), 1)

        document = CaseDocument.objects.get()
        self.assertEqual(document.case_id, self.owned_case.id)
        self.assertEqual(document.document_type, DocumentType.BOARDING_PASS.value)
        self.assertEqual(document.original_filename, "evidence.pdf")
        self.assertEqual(document.content_type, "application/pdf")
        self.assertEqual(document.file_size, len(b"%PDF-1.4 test"))

        self.assertEqual(response.data["id"], document.id)
        self.assertEqual(response.data["document_type"], DocumentType.BOARDING_PASS.value)
        self.assertEqual(response.data["filename"], "evidence.pdf")
        self.assertEqual(response.data["message"], "Document uploaded successfully.")
        self.assertIsNotNone(response.data["uploaded_at"])
        self.assertIsNotNone(response.data["download_url"])

    def test_upload_rejects_case_not_owned_by_passenger(self):
        self.client.force_authenticate(user=self.passenger_user)
        url = reverse(
            "passenger-case-document-upload",
            kwargs={"pk": self.other_case.pk},
        )

        response = self.client.post(
            url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.BOARDING_PASS.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_rejects_invalid_file_type(self):
        self.client.force_authenticate(user=self.passenger_user)
        upload = SimpleUploadedFile(
            "notes.txt",
            b"not allowed",
            content_type="text/plain",
        )

        response = self.client.post(
            self.upload_url,
            {
                "file": upload,
                "document_type": DocumentType.BOARDING_PASS.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_rejects_file_exceeding_max_size(self):
        self.client.force_authenticate(user=self.passenger_user)
        oversized_content = b"0" * (5 * 1024 * 1024 + 1)
        upload = SimpleUploadedFile(
            "large.pdf",
            oversized_content,
            content_type="application/pdf",
        )

        response = self.client.post(
            self.upload_url,
            {
                "file": upload,
                "document_type": DocumentType.BOARDING_PASS.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)
        self.assertEqual(CaseDocument.objects.count(), 0)
