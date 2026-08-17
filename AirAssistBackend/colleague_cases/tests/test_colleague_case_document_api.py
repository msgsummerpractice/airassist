from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from user.enums.roles import Roles
from user.models.users import Role, User


class ColleagueCaseDocumentApiTests(APITestCase):
    def setUp(self):
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)
        self.passenger_role = Role.objects.create(role=Roles.PASSENGER.value)

        self.colleague_user = User.objects.create_user(
            role=self.colleague_role,
            email="agent@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Agent",
        )
        self.other_colleague_user = User.objects.create_user(
            role=self.colleague_role,
            email="other-agent@example.com",
            password="testpass123",
            firstname="Other",
            lastname="Agent",
        )
        self.passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="passenger@example.com",
            password="testpass123",
            firstname="Pat",
            lastname="Passenger",
        )

        self.case = Case.objects.create(
            status=CaseState.ASSIGNED.value,
            gdpr_consent=True,
            assigned_colleague=self.colleague_user,
        )
        self.other_case = Case.objects.create(
            status=CaseState.ASSIGNED.value,
            gdpr_consent=True,
            assigned_colleague=self.other_colleague_user,
        )

        self.upload_url = reverse(
            "colleague-case-document-upload",
            kwargs={"pk": self.case.pk},
        )

    def _pdf_file(self, name="evidence.pdf", content=b"%PDF-1.4 test"):
        return SimpleUploadedFile(name, content, content_type="application/pdf")

    def test_upload_requires_authentication(self):
        response = self.client.post(
            self.upload_url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.CONTRACT.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_forbids_non_colleague_users(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(
            self.upload_url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.CONTRACT.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_creates_document_for_assigned_case(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(
            self.upload_url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.CONTRACT.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CaseDocument.objects.count(), 1)

        document = CaseDocument.objects.get()
        self.assertEqual(document.case_id, self.case.id)
        self.assertEqual(document.document_type, DocumentType.CONTRACT.value)
        self.assertEqual(document.original_filename, "evidence.pdf")
        self.assertEqual(document.content_type, "application/pdf")
        self.assertEqual(document.file_size, len(b"%PDF-1.4 test"))

        self.assertEqual(response.data["id"], document.id)
        self.assertEqual(response.data["document_type"], DocumentType.CONTRACT.value)
        self.assertEqual(response.data["filename"], "evidence.pdf")
        self.assertEqual(response.data["message"], "Document uploaded successfully.")
        self.assertIsNotNone(response.data["uploaded_at"])

    def test_upload_rejects_unassigned_case(self):
        self.client.force_authenticate(user=self.colleague_user)
        url = reverse("colleague-case-document-upload", kwargs={"pk": self.other_case.pk})

        response = self.client.post(
            url,
            {
                "file": self._pdf_file(),
                "document_type": DocumentType.CONTRACT.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_rejects_invalid_file_type(self):
        self.client.force_authenticate(user=self.colleague_user)
        upload = SimpleUploadedFile(
            "notes.txt",
            b"not allowed",
            content_type="text/plain",
        )

        response = self.client.post(
            self.upload_url,
            {
                "file": upload,
                "document_type": DocumentType.CONTRACT.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_upload_rejects_files_larger_than_five_mb(self):
        self.client.force_authenticate(user=self.colleague_user)
        upload = SimpleUploadedFile(
            "large.pdf",
            b"a" * (5 * 1024 * 1024 + 1),
            content_type="application/pdf",
        )

        response = self.client.post(
            self.upload_url,
            {
                "file": upload,
                "document_type": DocumentType.CONTRACT.value,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)
        self.assertEqual(CaseDocument.objects.count(), 0)

    def test_download_returns_document_for_assigned_case(self):
        self.client.force_authenticate(user=self.colleague_user)
        document = CaseDocument.objects.create(
            case=self.case,
            document_type=DocumentType.CONTRACT.value,
            file=self._pdf_file(),
            original_filename="contract.pdf",
            content_type="application/pdf",
            file_size=len(b"%PDF-1.4 test"),
        )
        url = reverse(
            "colleague-case-document-download",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn("contract.pdf", response["Content-Disposition"])

    def test_download_rejects_unassigned_case(self):
        self.client.force_authenticate(user=self.colleague_user)
        document = CaseDocument.objects.create(
            case=self.other_case,
            document_type=DocumentType.CONTRACT.value,
            file=self._pdf_file(),
            original_filename="other.pdf",
            content_type="application/pdf",
            file_size=len(b"%PDF-1.4 test"),
        )
        url = reverse(
            "colleague-case-document-download",
            kwargs={"pk": self.other_case.pk, "document_id": document.pk},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)