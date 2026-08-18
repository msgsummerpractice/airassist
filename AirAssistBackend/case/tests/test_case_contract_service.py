from datetime import date, datetime, time
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from reportlab.lib.pagesizes import LETTER

from case.services.case_contract_service import CaseContractService


class CaseContractServiceTests(SimpleTestCase):
    @patch("case.services.case_contract_service.SystemOptionService.get_pdf_preset")
    @patch("case.services.case_contract_service.canvas.Canvas")
    def test_build_pdf_applies_pdf_preset_fields_and_page_size(
        self,
        mock_canvas_class,
        mock_get_pdf_preset,
    ):
        mock_get_pdf_preset.return_value = {
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
        mock_pdf = mock_canvas_class.return_value

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

        CaseContractService._build_pdf(
            case=case,
            passenger=passenger,
            flights=[flight],
            reservation_number="ABC123",
        )

        mock_canvas_class.assert_called_once()
        self.assertEqual(mock_canvas_class.call_args.kwargs["pagesize"], LETTER)

        drawn_lines = [call.args[2] for call in mock_pdf.drawString.call_args_list]

        self.assertIn("Case Contract", drawn_lines)
        self.assertIn("Case ID: 7", drawn_lines)
        self.assertIn("Created At: 2026-08-18 10:30 UTC", drawn_lines)
        self.assertIn("Status: VALID", drawn_lines)
        self.assertIn("Name: Ada Lovelace", drawn_lines)
        self.assertIn("Flight 1: LH123 (Lufthansa)", drawn_lines)
        self.assertIn("Route: OTP -> FRA", drawn_lines)
        self.assertIn("Assigned Colleague: Ava Admin", drawn_lines)
        self.assertIn("Disruption Type: DELAY", drawn_lines)
        self.assertIn("Delay Length: More than 3 hours", drawn_lines)
        self.assertIn("Notes: Storm disruption", drawn_lines)
        self.assertIn("Prepared for review.", drawn_lines)
        self.assertFalse(any(line.startswith("Email:") for line in drawn_lines))
        self.assertFalse(any(line.startswith("Reservation Number:") for line in drawn_lines))