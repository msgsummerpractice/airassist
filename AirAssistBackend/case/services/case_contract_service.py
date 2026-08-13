from io import BytesIO

from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from ..enums.document_type_enum import DocumentType
from ..models.document import CaseDocument


class CaseContractGenerationError(Exception):
    pass


class CaseContractService:
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
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        y_position = height - 50

        lines = [
            "AirAssist Case Contract",
            "",
            f"Case ID: {case.id}",
            f"Created At: {case.created_at:%Y-%m-%d %H:%M UTC}",
            f"Status: {case.status}",
            f"Reservation Number: {reservation_number}",
            "",
            "Passenger Details",
            f"Name: {passenger.first_name} {passenger.last_name}",
            f"Date of Birth: {passenger.date_of_birth:%Y-%m-%d}",
            f"Email: {passenger.email}",
            f"Phone: {passenger.phone or '-'}",
            f"Address: {passenger.address or '-'}",
            f"Postal Code: {passenger.postal_code or '-'}",
            "",
            "Flight Details",
        ]

        for index, flight in enumerate(flights, start=1):
            lines.extend(
                [
                    f"Flight {index}: {flight.flight_number} ({flight.airline})",
                    f"Date: {flight.flight_date:%Y-%m-%d}",
                    f"Route: {flight.departing_airport} -> {flight.destination_airport}",
                    f"Planned Departure: {flight.planned_departure_time:%H:%M}",
                    f"Planned Arrival: {flight.planned_arrival_time:%H:%M}",
                    f"Problem Flight: {'Yes' if flight.is_problem_flight else 'No'}",
                    "",
                ]
            )

        if case.compensation_amount is not None:
            lines.extend(
                [
                    "Compensation",
                    f"Estimated Compensation: {case.compensation_amount}",
                    "",
                ]
            )

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