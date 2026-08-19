from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.passengers import Passenger
from user.enums.roles import Roles
from user.models.users import Role, User


class CaseDocumentDeleteApiTests(APITestCase):
    def setUp(self):
        passenger_role = Role.objects.create(role=Roles.PASSENGER.value)
        colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)
        self.passenger = User.objects.create_user(
            role=passenger_role,
            email="passenger@example.com",
            password="testpass123",
        )
        self.colleague = User.objects.create_user(
            role=colleague_role,
            email="colleague@example.com",
            password="testpass123",
        )
        self.case = Case.objects.create(
            status=CaseState.IN_REVIEW.value,
            gdpr_consent=True,
            assigned_colleague=self.colleague,
        )
        Passenger.objects.create(
            case=self.case,
            first_name="Pat",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email="passenger@example.com",
        )

    def _document(self, uploaded_by):
        return CaseDocument.objects.create(
            case=self.case,
            document_type=DocumentType.CONTRACT.value,
            uploaded_by=uploaded_by,
            file=SimpleUploadedFile(
                "document.pdf",
                b"pdf-content",
                content_type="application/pdf",
            ),
            original_filename="document.pdf",
            content_type="application/pdf",
            file_size=11,
        )

    def test_requires_authentication(self):
        document = self._document("PASSENGER")
        url = reverse(
            "passenger-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(CaseDocument.objects.filter(pk=document.pk).exists())

    def test_passenger_can_delete_own_document(self):
        document = self._document("PASSENGER")
        self.client.force_authenticate(user=self.passenger)
        url = reverse(
            "passenger-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CaseDocument.objects.filter(pk=document.pk).exists())

    def test_passenger_cannot_delete_colleague_document(self):
        document = self._document("COLLEAGUE")
        self.client.force_authenticate(user=self.passenger)
        url = reverse(
            "passenger-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(CaseDocument.objects.filter(pk=document.pk).exists())

    def test_colleague_can_delete_own_document(self):
        document = self._document("COLLEAGUE")
        self.client.force_authenticate(user=self.colleague)
        url = reverse(
            "colleague-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CaseDocument.objects.filter(pk=document.pk).exists())

    def test_colleague_cannot_delete_passenger_document(self):
        document = self._document("PASSENGER")
        self.client.force_authenticate(user=self.colleague)
        url = reverse(
            "colleague-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(CaseDocument.objects.filter(pk=document.pk).exists())

    def test_passenger_can_delete_unknown_document(self):
        document = self._document(None)
        self.client.force_authenticate(user=self.passenger)
        url = reverse(
            "passenger-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CaseDocument.objects.filter(pk=document.pk).exists())

    def test_colleague_can_delete_unknown_document(self):
        document = self._document(None)
        self.client.force_authenticate(user=self.colleague)
        url = reverse(
            "colleague-case-document-delete",
            kwargs={"pk": self.case.pk, "document_id": document.pk},
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CaseDocument.objects.filter(pk=document.pk).exists())
