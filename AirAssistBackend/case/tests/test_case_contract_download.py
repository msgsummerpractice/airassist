import json

from datetime import date, time
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger
from case.services.case_contract_service import CaseContractService


class CaseContractDownloadViewTests(APITestCase):
    def create_case_with_contract(self):
        case = Case.objects.create(
            reservation_number="ABC123",
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=case,
            first_name="Ada",
            last_name="Lovelace",
            date_of_birth=date(1990, 1, 1),
            email="ada@example.com",
            phone="1234567890",
            address="Main Street 1",
            postal_code="12345",
        )
        Flight.objects.create(
            case=case,
            flight_date=date(2026, 8, 3),
            flight_number="LH123",
            airline="Lufthansa",
            reservation_number="ABC123",
            departing_airport="OTP",
            destination_airport="FRA",
            planned_departure_time=time(10, 0),
            planned_arrival_time=time(12, 0),
            is_problem_flight=True,
            is_main_flight=True,
        )
        contract_document = CaseContractService.generate_for_case(case)
        return case, contract_document

    def test_case_creation_generates_and_exposes_contract_pdf(self):
        case, contract_document = self.create_case_with_contract()

        self.assertEqual(
            CaseDocument.objects.filter(document_type=DocumentType.CONTRACT.value).count(),
            1,
        )
        self.assertTrue(contract_document.original_filename.endswith(".pdf"))

        download_response = self.client.get(f"/api/cases/{case.id}/contract/")

        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response.get("Content-Type"), "application/pdf")
        self.assertIn("attachment;", download_response.get("Content-Disposition"))
        self.assertTrue(b"".join(download_response.streaming_content).startswith(b"%PDF"))

    def test_download_returns_404_when_contract_is_missing(self):
        response = self.client.get("/api/cases/999/contract/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data["success"])

    def test_download_regenerates_contract_when_file_is_missing(self):
        case, contract_document = self.create_case_with_contract()
        contract_document.file.delete(save=False)

        download_response = self.client.get(f"/api/cases/{case.id}/contract/")

        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response.get("Content-Type"), "application/pdf")
        self.assertIn("attachment;", download_response.get("Content-Disposition"))
        self.assertTrue(b"".join(download_response.streaming_content).startswith(b"%PDF"))
        self.assertEqual(
            CaseDocument.objects.filter(document_type=DocumentType.CONTRACT.value).count(),
            1,
        )
