import json
from unittest.mock import patch

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.document_type_enum import DocumentType
from case.models.document import CaseDocument
from case_email.services.email_service import send_basic_email


class CaseRegistrationEmailAttachmentTests(APITestCase):
    def setUp(self):
        mail.outbox = []

    def build_payload(self, **overrides):
        payload = {
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
        payload.update(overrides)
        return payload

    def submit_case(self, **overrides):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(
                "/api/cases/",
                data=self.build_payload(**overrides),
                format="multipart",
            )

    @patch("case.views.case_creation_view.CaseService.create_passenger_account")
    @patch("case.views.case_creation_view.CaseService.calculate_case_compensation")
    def test_registration_email_is_sent_to_the_passenger(
        self,
        _calculate_case_compensation,
        _create_passenger_account,
    ):
        response = self.submit_case()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]
        self.assertEqual(email.to, ["ada@example.com"])
        self.assertEqual(email.subject, "Case Submission Confirmation")
        self.assertIn(
            f"<strong>Case ID:</strong> {response.data['data']['case_id']}",
            email.body,
        )

    @patch("case.views.case_creation_view.CaseService.create_passenger_account")
    @patch("case.views.case_creation_view.CaseService.calculate_case_compensation")
    def test_generated_contract_pdf_is_attached_to_the_registration_email(
        self,
        _calculate_case_compensation,
        _create_passenger_account,
    ):
        response = self.submit_case()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        contract_document = CaseDocument.objects.get(
            document_type=DocumentType.CONTRACT.value,
        )
        email = mail.outbox[0]
        self.assertEqual(len(email.attachments), 2)

        filename, content, mimetype = next(
            attachment
            for attachment in email.attachments
            if isinstance(attachment, tuple) and attachment[2] == "application/pdf"
        )
        self.assertEqual(filename, contract_document.original_filename)
        self.assertEqual(mimetype, "application/pdf")
        self.assertTrue(content.startswith(b"%PDF"))
        self.assertEqual(len(content), contract_document.file_size)
        self.assertIn("contract PDF is attached", email.body)

    @patch("case.views.case_creation_view.CaseService.create_passenger_account")
    @patch("case.views.case_creation_view.CaseService.calculate_case_compensation")
    def test_no_email_is_sent_when_the_case_is_not_eligible(
        self,
        _calculate_case_compensation,
        _create_passenger_account,
    ):
        response = self.submit_case(
            disruption=json.dumps(
                {
                    "motive": "DELAY",
                    "delay_type": "LESS_THAN_3_HOURS",
                }
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)

    @patch("case.views.case_creation_view.send_template_email")
    @patch("case.views.case_creation_view.CaseService.create_passenger_account")
    @patch("case.views.case_creation_view.CaseService.calculate_case_compensation")
    def test_case_creation_still_succeeds_when_confirmation_email_fails(
        self,
        _calculate_case_compensation,
        _create_passenger_account,
        mock_send_template_email,
    ):
        mock_send_template_email.side_effect = RuntimeError("SMTP auth failed")

        response = self.submit_case()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(
            CaseDocument.objects.filter(document_type=DocumentType.CONTRACT.value).count(),
            1,
        )
        mock_send_template_email.assert_called_once()


class SendBasicEmailAttachmentTests(APITestCase):
    def setUp(self):
        mail.outbox = []

    def test_sends_email_without_attachments_by_default(self):
        send_basic_email(
            to_email="ada@example.com",
            subject="Case Submission Confirmation",
            body="Your case was submitted successfully.",
        )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].attachments, [])

    def test_attaches_every_provided_attachment(self):
        send_basic_email(
            to_email="ada@example.com",
            subject="Case Submission Confirmation",
            body="Your case was submitted successfully.",
            attachments=[
                ("case-1-contract.pdf", b"%PDF-1.4", "application/pdf")],
        )

        self.assertEqual(len(mail.outbox), 1)

        filename, content, mimetype = mail.outbox[0].attachments[0]
        self.assertEqual(filename, "case-1-contract.pdf")
        self.assertEqual(content, b"%PDF-1.4")
        self.assertEqual(mimetype, "application/pdf")
