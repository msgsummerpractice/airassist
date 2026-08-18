import json
from io import BytesIO
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

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
        email_preset = SystemOptionService.get_email_preset()
        template = CaseContractService._load_contract_template()
        page_size = LETTER if pdf_preset.get("page_size") == "LETTER" else A4
        buffer = BytesIO()
        layout = pdf_preset.get("layout", "STANDARD")
        margins = template["layout"]["margins_mm"]
        doc = SimpleDocTemplate(
            buffer,
            pagesize=page_size,
            leftMargin=margins["left"] * mm,
            rightMargin=margins["right"] * mm,
            topMargin=margins["top"] * mm,
            bottomMargin=margins["bottom"] * mm,
            title=f"Case {case.id} Contract",
            author=email_preset.get("sender_name") or "AirAssist",
        )
        styles = CaseContractService._build_styles(layout, template)
        sections = CaseContractService._build_sections(
            case=case,
            passenger=passenger,
            flights=flights,
            reservation_number=reservation_number,
            pdf_preset=pdf_preset,
            email_preset=email_preset,
            template=template,
        )
        story = CaseContractService._build_story(
            case=case,
            sections=sections,
            pdf_preset=pdf_preset,
            styles=styles,
            template=template,
        )
        footer_text = pdf_preset.get("footer_text", "")
        doc.build(
            story,
            onFirstPage=lambda canv, document: CaseContractService._draw_page_chrome(
                canv,
                document,
                case=case,
                footer_text=footer_text,
            ),
            onLaterPages=lambda canv, document: CaseContractService._draw_page_chrome(
                canv,
                document,
                case=case,
                footer_text=footer_text,
            ),
        )
        return buffer.getvalue()

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_contract_template():
        template_path = (
            Path(settings.BASE_DIR)
            / "case"
            / "templates"
            / "case_contract_template.json"
        )
        with template_path.open("r", encoding="utf-8") as template_file:
            return json.load(template_file)

    @staticmethod
    def _build_styles(layout, template):
        base_styles = getSampleStyleSheet()
        layout_config = template["layout"]
        colors_config = template["colors"]
        body_config = layout_config["body"].get(layout, layout_config["body"]["STANDARD"])
        section_spacing = layout_config["section_spacing"].get(
            layout,
            layout_config["section_spacing"]["STANDARD"],
        )
        body_font_size = body_config["font_size"]
        body_leading = body_config["leading"]

        return {
            "title": ParagraphStyle(
                "ContractTitle",
                parent=base_styles["Heading1"],
                fontName="Helvetica-Bold",
                fontSize=18,
                leading=22,
                textColor=colors.HexColor(colors_config["title"]),
                spaceAfter=8,
            ),
            "subtitle": ParagraphStyle(
                "ContractSubtitle",
                parent=base_styles["BodyText"],
                fontName="Helvetica",
                fontSize=10,
                leading=13,
                textColor=colors.HexColor(colors_config["subtitle"]),
                spaceAfter=section_spacing,
            ),
            "section": ParagraphStyle(
                "ContractSection",
                parent=base_styles["Heading3"],
                fontName="Helvetica-Bold",
                fontSize=11.5,
                leading=14,
                textColor=colors.HexColor(colors_config["section"]),
                spaceBefore=section_spacing,
                spaceAfter=5,
            ),
            "cell": ParagraphStyle(
                "ContractCell",
                parent=base_styles["BodyText"],
                fontName="Helvetica",
                fontSize=body_font_size,
                leading=body_leading,
                textColor=colors.HexColor(colors_config["text"]),
            ),
            "label": ParagraphStyle(
                "ContractLabel",
                parent=base_styles["BodyText"],
                fontName="Helvetica-Bold",
                fontSize=body_font_size,
                leading=body_leading,
                textColor=colors.HexColor(colors_config["title"]),
            ),
            "note": ParagraphStyle(
                "ContractNote",
                parent=base_styles["BodyText"],
                fontName="Helvetica",
                fontSize=body_font_size,
                leading=body_leading,
                textColor=colors.HexColor(colors_config["text"]),
                spaceAfter=section_spacing,
            ),
        }

    @staticmethod
    def _build_sections(case, passenger, flights, reservation_number, pdf_preset, email_preset, template):
        exported_fields = set(pdf_preset.get("exported_fields", []))
        disruption = case.disruptions.order_by("-created_at").first()
        labels = template["labels"]
        sections = []

        metadata_rows = []
        if "case_number" in exported_fields:
            metadata_rows.append((labels["reference_number"], str(case.id)))
        if pdf_preset.get("include_case_timeline", True):
            metadata_rows.append((labels["document_date"], case.created_at.strftime("%Y-%m-%d %H:%M UTC")))
        if "claim_status" in exported_fields:
            metadata_rows.append((labels["claim_status"], case.status))
        if reservation_number:
            metadata_rows.append((labels["reservation"], reservation_number))
        if metadata_rows:
            sections.append(("metadata", metadata_rows))

        company_rows = [
            (labels["organisation"], email_preset.get("sender_name") or "AirAssist"),
            (labels["contact_email"], email_preset.get("sender_email") or "-"),
        ]
        reply_to = email_preset.get("reply_to_email")
        if reply_to and reply_to != email_preset.get("sender_email"):
            company_rows.append((labels["reply_to"], reply_to))
        sections.append(("company", company_rows))

        passenger_rows = []
        if "passenger_name" in exported_fields:
            passenger_rows.append((labels["name"], f"{passenger.first_name} {passenger.last_name}".strip()))
        if pdf_preset.get("include_passenger_contact", True):
            if "passenger_email" in exported_fields:
                passenger_rows.append((labels["email"], passenger.email))
            passenger_rows.extend(
                [
                    (labels["phone"], passenger.phone or "-"),
                    (labels["address"], passenger.address or "-"),
                    (labels["postal_code"], passenger.postal_code or "-"),
                ]
            )
        sections.append(("passenger", passenger_rows))

        flight_headers_config = template["flight_headers"]
        flight_headers = []
        if "flight_number" in exported_fields:
            flight_headers.extend([flight_headers_config["flight_number"], flight_headers_config["airline"]])
        if "departure_date" in exported_fields:
            flight_headers.append(flight_headers_config["departure_date"])
        if "route" in exported_fields:
            flight_headers.append(flight_headers_config["route"])
        flight_headers.extend([
            flight_headers_config["departure"],
            flight_headers_config["arrival"],
            flight_headers_config["problem_flight"],
        ])

        flight_rows = []
        for index, flight in enumerate(flights, start=1):
            row = []
            if "flight_number" in exported_fields:
                row.extend([flight.flight_number, flight.airline])
            if "departure_date" in exported_fields:
                row.append(flight.flight_date.strftime("%Y-%m-%d"))
            if "route" in exported_fields:
                row.append(f"{flight.departing_airport} -> {flight.destination_airport}")
            row.extend(
                [
                    flight.planned_departure_time.strftime("%H:%M"),
                    flight.planned_arrival_time.strftime("%H:%M"),
                    "Yes" if flight.is_problem_flight else "No",
                ]
            )
            flight_rows.append(row)
        sections.append(("flights", {"headers": flight_headers, "rows": flight_rows}))

        if "assigned_colleague" in exported_fields:
            assigned_colleague = case.assigned_colleague
            colleague_name = (
                f"{assigned_colleague.firstname} {assigned_colleague.lastname}".strip()
                if assigned_colleague
                else "Unassigned"
            )
            sections.append(("metadata", [(labels["assigned_colleague"], colleague_name)]))

        if pdf_preset.get("include_disruption_summary", True) and disruption is not None:
            disruption_rows = []
            if "disruption_type" in exported_fields:
                disruption_rows.append((labels["disruption_type"], disruption.motive))
            if "delay_minutes" in exported_fields and disruption.delay_type:
                disruption_rows.append(
                    (
                        labels["delay_length"],
                        CaseContractService.DELAY_TYPE_LABELS.get(
                            disruption.delay_type,
                            disruption.delay_type.replace("_", " ").title(),
                        ),
                    )
                )
            if disruption.incident_description:
                disruption_rows.append((labels["notes"], disruption.incident_description))
            if disruption_rows:
                sections.append(("disruption", disruption_rows))

        if case.compensation_amount is not None:
            sections.append(
                (
                    "compensation",
                    [(labels["estimated_compensation"], str(case.compensation_amount))],
                )
            )

        return sections

    @staticmethod
    def _build_story(case, sections, pdf_preset, styles, template):
        title = template["titles"]["branded"] if pdf_preset.get("include_branding", True) else template["titles"]["plain"]
        story = [
            Paragraph(title, styles["title"]),
            Paragraph(
                template["titles"]["subtitle"].format(case_id=case.id),
                styles["subtitle"],
            ),
        ]

        for section_key, section_data in sections:
            story.append(Paragraph(template["section_titles"][section_key], styles["section"]))

            if section_key == "flights":
                story.append(
                    CaseContractService._build_flight_table(section_data, styles, template)
                )
            else:
                story.append(
                    CaseContractService._build_key_value_table(section_data, styles, template)
                )

            story.append(Spacer(1, 6))

        return story

    @staticmethod
    def _build_key_value_table(rows, styles, template):
        table_rows = [
            [Paragraph(f"<b>{label}</b>", styles["label"]), Paragraph(str(value), styles["cell"])]
            for label, value in rows
        ]
        table = Table(table_rows, colWidths=[52 * mm, None], hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor(template["colors"]["table_label_bg"])),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor(template["colors"]["text"])),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor(template["colors"]["table_grid"])),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor(template["colors"]["table_inner"])),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        return table

    @staticmethod
    def _build_flight_table(flight_data, styles, template):
        headers = [Paragraph(f"<b>{header}</b>", styles["label"]) for header in flight_data["headers"]]
        rows = [headers]
        for row in flight_data["rows"]:
            rows.append([Paragraph(str(value), styles["cell"]) for value in row])

        table = Table(rows, repeatRows=1, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(template["colors"]["flight_header_bg"])),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor(template["colors"]["flight_header_text"])),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(template["colors"]["table_grid"])),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        return table

    @staticmethod
    def _draw_page_chrome(canv, document, case, footer_text):
        template = CaseContractService._load_contract_template()
        canv.saveState()
        canv.setStrokeColor(colors.HexColor(template["colors"]["table_grid"]))
        canv.setLineWidth(0.6)
        canv.line(document.leftMargin, document.bottomMargin - 8, document.pagesize[0] - document.rightMargin, document.bottomMargin - 8)
        canv.setFont("Helvetica", 8.5)
        footer_label = footer_text or f"Case #{case.id}"
        canv.setFillColor(colors.HexColor(template["colors"]["footer"]))
        canv.drawString(document.leftMargin, document.bottomMargin - 18, f"Case #{case.id} | {footer_label}")
        canv.drawRightString(
            document.pagesize[0] - document.rightMargin,
            document.bottomMargin - 18,
            f"Page {canv.getPageNumber()}",
        )
        canv.restoreState()