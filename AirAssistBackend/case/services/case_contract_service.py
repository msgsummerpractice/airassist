from io import BytesIO

from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.pdfgen import canvas

from system_options.services import SystemOptionService

from ..enums.document_type_enum import DocumentType
from ..models.document import CaseDocument


class CaseContractGenerationError(Exception):
    pass


class CaseContractService:
    DELAY_TYPE_LABELS = {
        "LESS_THAN_3_HOURS": "Less than 3 hours",
        "MORE_THAN_3_HOURS": "More than 3 hours",
        "CONNECTION_FLIGHT_LOST": "Connection flight lost",
    }

    @staticmethod
    def generate_for_case(case):
        existing_contract = case.documents.filter(
            document_type=DocumentType.CONTRACT.value,
        ).order_by("-uploaded_at").first()

        if existing_contract is not None:
            return existing_contract

        passenger = case.passengers.first()
        flights = list(case.flights.order_by("-is_main_flight", "flight_date", "planned_departure_time"))

        if passenger is None or not flights:
            raise CaseContractGenerationError(
                "Cannot generate a contract without passenger and flight details."
            )

        reservation_number = case.reservation_number or flights[0].reservation_number
        file_name = f"case-{case.id}-contract.pdf"

        try:
            pdf_content = CaseContractService._build_pdf(
                case=case,
                passenger=passenger,
                flights=flights,
                reservation_number=reservation_number,
            )
            contract_file = ContentFile(pdf_content, name=file_name)

            return CaseDocument.objects.create(
                case=case,
                document_type=DocumentType.CONTRACT.value,
                file=contract_file,
                original_filename=file_name,
                content_type="application/pdf",
                file_size=len(pdf_content),
            )
        except Exception as exc:
            raise CaseContractGenerationError("Failed to generate contract PDF.") from exc

    @staticmethod
    def _build_pdf(case, passenger, flights, reservation_number):
        pdf_preset = SystemOptionService.get_pdf_preset()
        page_size = LETTER if pdf_preset.get("page_size") == "LETTER" else A4
        exported_fields = set(pdf_preset.get("exported_fields", []))
        disruption = case.disruptions.order_by("-created_at").first()
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=page_size)
        width, height = page_size
        y_position = height - 50

        lines = [
            "AirAssist Case Contract" if pdf_preset.get("include_branding", True) else "Case Contract",
            "",
        ]

        if "case_number" in exported_fields:
            lines.append(f"Case ID: {case.id}")
        if pdf_preset.get("include_case_timeline", True):
            lines.append(f"Created At: {case.created_at:%Y-%m-%d %H:%M UTC}")
        if "claim_status" in exported_fields:
            lines.append(f"Status: {case.status}")
        if any(
            field in exported_fields
            for field in ("case_number", "claim_status")
        ) or pdf_preset.get("include_case_timeline", True):
            lines.append("")

        lines.append("Passenger Details")

        if "passenger_name" in exported_fields:
            lines.append(f"Name: {passenger.first_name} {passenger.last_name}")
        if pdf_preset.get("include_passenger_contact", True):
            if "passenger_email" in exported_fields:
                lines.append(f"Email: {passenger.email}")
            lines.extend(
                [
                    f"Phone: {passenger.phone or '-'}",
                    f"Address: {passenger.address or '-'}",
                    f"Postal Code: {passenger.postal_code or '-'}",
                ]
            )

        lines.extend(["", "Flight Details"])

        for index, flight in enumerate(flights, start=1):
            if "flight_number" in exported_fields:
                lines.append(f"Flight {index}: {flight.flight_number} ({flight.airline})")
            if "departure_date" in exported_fields:
                lines.append(f"Date: {flight.flight_date:%Y-%m-%d}")
            if "route" in exported_fields:
                lines.append(
                    f"Route: {flight.departing_airport} -> {flight.destination_airport}"
                )
            lines.extend(
                [
                    f"Planned Departure: {flight.planned_departure_time:%H:%M}",
                    f"Planned Arrival: {flight.planned_arrival_time:%H:%M}",
                    f"Problem Flight: {'Yes' if flight.is_problem_flight else 'No'}",
                    "",
                ]
            )

        if "assigned_colleague" in exported_fields:
            assigned_colleague = case.assigned_colleague
            colleague_name = (
                f"{assigned_colleague.firstname} {assigned_colleague.lastname}".strip()
                if assigned_colleague
                else "Unassigned"
            )
            lines.append(f"Assigned Colleague: {colleague_name}")

        if pdf_preset.get("include_disruption_summary", True) and disruption is not None:
            lines.extend(["", "Disruption Summary"])
            if "disruption_type" in exported_fields:
                lines.append(f"Disruption Type: {disruption.motive}")
            if "delay_minutes" in exported_fields and disruption.delay_type:
                lines.append(
                    "Delay Length: "
                    f"{CaseContractService.DELAY_TYPE_LABELS.get(disruption.delay_type, disruption.delay_type.replace('_', ' ').title())}"
                )
            if disruption.incident_description:
                lines.append(f"Notes: {disruption.incident_description}")

        if case.compensation_amount is not None:
            lines.extend(
                [
                    "Compensation",
                    f"Estimated Compensation: {case.compensation_amount}",
                    "",
                ]
            )

        footer_text = pdf_preset.get("footer_text")
        if footer_text:
            lines.extend(["", footer_text])

        pdf.setTitle(f"Case {case.id} Contract")

        for line in lines:
            if y_position < 50:
                pdf.showPage()
                y_position = height - 50

            if line == "AirAssist Case Contract":
                pdf.setFont("Helvetica-Bold", 16)
            elif line in {"Passenger Details", "Flight Details", "Compensation"}:
                pdf.setFont("Helvetica-Bold", 12)
            else:
                pdf.setFont("Helvetica", 11)

            pdf.drawString(50, y_position, line)
            y_position -= 20 if line == "" else 16

        pdf.save()
        return buffer.getvalue()