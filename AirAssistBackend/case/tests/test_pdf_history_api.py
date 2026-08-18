from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.passengers import Passenger
from user.models.users import Role, User


class PdfHistoryApiTests(APITestCase):
    def setUp(self):
        self.system_admin_role = Role.objects.create(role="SYSTEM_ADMIN")
        self.colleague_role = Role.objects.create(role="COLLEAGUE")
        self.passenger_role = Role.objects.create(role="PASSENGER")

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
        self.passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="ada@example.com",
            password="testpass123",
            firstname="Ada",
            lastname="Lovelace",
        )

        self.first_case = Case.objects.create(gdpr_consent=True)
        Passenger.objects.create(
            case=self.first_case,
            first_name="Ada",
            last_name="Lovelace",
            date_of_birth="1990-01-01",
            email="ada@example.com",
        )
        self.second_case = Case.objects.create(gdpr_consent=True)
        Passenger.objects.create(
            case=self.second_case,
            first_name="Grace",
            last_name="Hopper",
            date_of_birth="1985-05-05",
            email="grace@example.com",
        )

        self.contract_document = self.create_document(
            case=self.first_case,
            document_type=DocumentType.CONTRACT.value,
            filename="case-1-contract.pdf",
            content=b"%PDF-1.4 contract",
        )
        self.boarding_pass_document = self.create_document(
            case=self.second_case,
            document_type=DocumentType.BOARDING_PASS.value,
            filename="boarding-pass.pdf",
            content=b"%PDF-1.4 boarding pass",
        )

        self.list_url = "/api/cases/documents/"

    def create_document(self, case, document_type, filename, content):
        return CaseDocument.objects.create(
            case=case,
            document_type=document_type,
            file=ContentFile(content, name=filename),
            original_filename=filename,
            content_type="application/pdf",
            file_size=len(content),
        )

    def download_url(self, document_id):
        return f"/api/cases/documents/{document_id}/download/"

    # --- list access control ---

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_forbids_passengers(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_allows_colleagues(self):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 2)

    # --- list payload and filters ---

    def test_list_returns_documents_with_required_fields(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        document = next(
            item for item in response.data["data"]
            if item["id"] == self.contract_document.id
        )
        self.assertEqual(document["document_name"], "case-1-contract.pdf")
        self.assertEqual(document["passenger_name"], "Ada Lovelace")
        self.assertEqual(document["case_id"], self.first_case.id)
        self.assertEqual(document["document_type"],
                         DocumentType.CONTRACT.value)
        self.assertIn("uploaded_at", document)

    def test_list_is_ordered_by_newest_upload_first(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.list_url)

        returned_ids = [item["id"] for item in response.data["data"]]
        self.assertEqual(
            returned_ids,
            [self.boarding_pass_document.id, self.contract_document.id],
        )

    def test_list_can_be_filtered_by_case_id(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(
            self.list_url, {"case_id": self.first_case.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]
                         ["id"], self.contract_document.id)

    def test_list_can_be_filtered_by_document_type(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(
            self.list_url,
            {"document_type": DocumentType.CONTRACT.value},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]
                         ["id"], self.contract_document.id)

    def test_list_can_be_filtered_by_passenger_name(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.list_url, {"passenger_name": "hopper"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(
            response.data["data"][0]["id"],
            self.boarding_pass_document.id,
        )

    def test_list_rejects_an_unknown_document_type(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.list_url, {"document_type": "INVOICE"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_is_paginated(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.list_url, {"page_size": 1, "page": 2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(
            response.data["pagination"],
            {"count": 2, "page": 2, "page_size": 1, "num_pages": 2},
        )

    # --- download ---

    def test_download_requires_authentication(self):
        response = self.client.get(
            self.download_url(self.contract_document.id))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_download_forbids_passengers(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.get(
            self.download_url(self.contract_document.id))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_returns_the_stored_document(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(
            self.download_url(self.contract_document.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/pdf")
        self.assertIn("attachment;", response.get("Content-Disposition"))
        self.assertIn("case-1-contract.pdf",
                      response.get("Content-Disposition"))
        self.assertEqual(b"".join(response.streaming_content),
                         b"%PDF-1.4 contract")

    def test_download_returns_404_for_an_unknown_document(self):
        self.client.force_authenticate(user=self.system_admin)

        response = self.client.get(self.download_url(999999))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data["success"])
