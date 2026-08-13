import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.document_type_enum import DocumentType
from case.models.document import CaseDocument


class CaseContractDownloadViewTests(APITestCase):
    def build_payload(self):
        return {
            "flight_date": "2026-08-03",
            "flight_number": "LH123",
            "airline": "Lufthansa",
            "reservation_number": "ABC123",
            "departing_airport": "OTP",
            "destination_airport": "FRA",
            "connection_flights": json.dumps([]),
            "planned_departure_time": "2026-08-03T10:00:00Z",
            "planned_arrival_time": "2026-08-03T12:00:00Z",
            "is_problem_flight": True,
            "is_main_flight": True,
            "first_name": "Ada",
            "last_name": "Lovelace",
            "date_of_birth": "1990-01-01",
            "email": "ada@example.com",
            "phone": "1234567890",
            "address": "Main Street 1",
            "postal_code": "12345",
            "boarding_pass": SimpleUploadedFile(
                "boarding-pass.pdf",
                b"file",
                content_type="application/pdf",
            ),
            "passport": SimpleUploadedFile(
                "passport.jpg",
                b"file",
                content_type="image/jpeg",
            ),
            "gdpr_consent": True,
            "disruption": json.dumps(
                {
                    "motive": "DELAY",
                    "delay_type": "MORE_THAN_3_HOURS",
                }
            ),
        }

    @patch("case.views.case_creation_view.CaseService.create_passenger_account")
    @patch("case.views.case_creation_view.CaseService.calculate_case_compensation")
    def test_case_creation_generates_and_exposes_contract_pdf(
        self,
        calculate_case_compensation,
        create_passenger_account,
    ):
        response = self.client.post(
            "/api/cases/",
            data=self.build_payload(),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("contract_download_url", response.data["data"])
        self.assertIn("ready for download", response.data["message"])
        self.assertEqual(
            CaseDocument.objects.filter(document_type=DocumentType.CONTRACT.value).count(),
            1,
        )

        contract_document = CaseDocument.objects.get(
            document_type=DocumentType.CONTRACT.value,
        )
        self.assertTrue(contract_document.original_filename.endswith(".pdf"))

        download_response = self.client.get(
            f"/api/cases/{response.data['data']['case_id']}/contract/"
        )

        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response.get("Content-Type"), "application/pdf")
        self.assertIn("attachment;", download_response.get("Content-Disposition"))
        self.assertTrue(b"".join(download_response.streaming_content).startswith(b"%PDF"))
        calculate_case_compensation.assert_called_once()
        create_passenger_account.assert_called_once()

    def test_download_returns_404_when_contract_is_missing(self):
        response = self.client.get("/api/cases/999/contract/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data["success"])