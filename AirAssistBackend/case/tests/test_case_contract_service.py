from datetime import date, datetime, time
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from reportlab.lib.pagesizes import LETTER

from case.services.case_contract_service import CaseContractService


class CaseContractServiceTests(SimpleTestCase):
    def build_pdf_preset(self):
        return {
            "layout": "DETAILED",
            "page_size": "LETTER",
            "include_branding": False,
            "include_disruption_summary": True,
            "include_passenger_contact": False,
            "include_case_timeline": True,
            "exported_fields": [
                "case_number",
                "passenger_name",
                "flight_number",
                "route",
                "claim_status",
                "delay_minutes",
                "assigned_colleague",
                "disruption_type",
            ],
            "footer_text": "Prepared for review.",
        }

    def build_case_bundle(self):
        disruption = Mock(motive="DELAY", incident_description="Storm disruption")
        disruption.delay_type = "MORE_THAN_3_HOURS"
        case = Mock()
        case.id = 7
        case.created_at = datetime(2026, 8, 18, 10, 30)
        case.status = "VALID"
        case.reservation_number = "ABC123"
        case.compensation_amount = None
        case.assigned_colleague = Mock(firstname="Ava", lastname="Admin")
        case.disruptions.order_by.return_value.first.return_value = disruption

        passenger = Mock()
        passenger.first_name = "Ada"
        passenger.last_name = "Lovelace"
        passenger.date_of_birth = date(1990, 1, 1)
        passenger.email = "ada@example.com"
        passenger.phone = "123456789"
        passenger.address = "Main Street 1"
        passenger.postal_code = "12345"

        flight = Mock()
        flight.flight_number = "LH123"
        flight.airline = "Lufthansa"
        flight.flight_date = date(2026, 8, 3)
        flight.departing_airport = "OTP"
        flight.destination_airport = "FRA"
        flight.planned_departure_time = time(10, 0)
        flight.planned_arrival_time = time(12, 0)
        flight.is_problem_flight = True

        return case, passenger, [flight]

    @patch("case.services.case_contract_service.SystemOptionService.get_email_preset")
    @patch("case.services.case_contract_service.SystemOptionService.get_pdf_preset")
    def test_build_sections_applies_pdf_preset_fields(
        self,
        mock_get_pdf_preset,
        mock_get_email_preset,
    ):
        mock_get_pdf_preset.return_value = self.build_pdf_preset()
        mock_get_email_preset.return_value = {
            "sender_name": "AirAssist Support",
            "sender_email": "support@example.com",
            "reply_to_email": "support@example.com",
        }
        case, passenger, flights = self.build_case_bundle()
        template = CaseContractService._load_contract_template()

        sections = CaseContractService._build_sections(
            case=case,
            passenger=passenger,
            flights=flights,
            reservation_number="ABC123",
            pdf_preset=mock_get_pdf_preset.return_value,
            email_preset=mock_get_email_preset.return_value,
            template=template,
        )

        self.assertIn(
            ("metadata", [(template["labels"]["assigned_colleague"], "Ava Admin")]),
            sections,
        )
        self.assertTrue(any(section[0] == "company" for section in sections))
        self.assertTrue(any(section[0] == "flights" for section in sections))
        disruption_rows = next(
            rows for key, rows in sections if key == "disruption"
        )
        self.assertIn((template["labels"]["disruption_type"], "DELAY"), disruption_rows)
        self.assertIn((template["labels"]["delay_length"], "More than 3 hours"), disruption_rows)
        passenger_rows = next(rows for key, rows in sections if key == "passenger")
        self.assertFalse(any(label == template["labels"]["email"] for label, _ in passenger_rows))

    @patch("case.services.case_contract_service.SystemOptionService.get_email_preset")
    @patch("case.services.case_contract_service.SystemOptionService.get_pdf_preset")
    @patch("case.services.case_contract_service.SimpleDocTemplate")
    def test_build_pdf_uses_structured_template_and_page_size(
        self,
        mock_doc_class,
        mock_get_pdf_preset,
        mock_get_email_preset,
    ):
        mock_get_pdf_preset.return_value = self.build_pdf_preset()
        mock_get_email_preset.return_value = {
            "sender_name": "AirAssist Support",
            "sender_email": "support@example.com",
            "reply_to_email": "support@example.com",
        }
        case, passenger, flights = self.build_case_bundle()
        mock_doc = mock_doc_class.return_value
        template = CaseContractService._load_contract_template()

        CaseContractService._build_pdf(
            case=case,
            passenger=passenger,
            flights=flights,
            reservation_number="ABC123",
        )

        mock_doc_class.assert_called_once()
        self.assertEqual(mock_doc_class.call_args.kwargs["pagesize"], LETTER)
        mock_doc.build.assert_called_once()
        story = mock_doc.build.call_args.args[0]
        self.assertGreater(len(story), 4)
        self.assertEqual(story[0].getPlainText(), template["titles"]["plain"])
        self.assertEqual(story[1].getPlainText(), template["titles"]["subtitle"].format(case_id=7))