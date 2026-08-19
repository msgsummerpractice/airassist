from io import BytesIO

import pytesseract
from mrz.checker.td3 import TD3CodeChecker
from PIL import Image
from rest_framework.exceptions import ValidationError


class PassportScanService:
    @staticmethod
    def scan(uploaded_file):
        image = Image.open(BytesIO(uploaded_file.read()))
        mrz_text = PassportScanService._extract_mrz_text(image)

        try:
            mrz = TD3CodeChecker(mrz_text)
        except Exception as exc:
            raise ValidationError(
                "Could not read passport MRZ. Please try a clearer photo."
            ) from exc

        fields = mrz.fields()
        return {
            "first_name": fields.name.title(),
            "last_name": fields.surname.title(),
            "date_of_birth": PassportScanService._format_date(fields.birth_date),
            "document_number": fields.document_number,
            "nationality": fields.nationality,
            "expiry_date": PassportScanService._format_date(fields.expiry_date),
        }

    @staticmethod
    def _extract_mrz_text(image):
        width, height = image.size
        # MRZ sits in the bottom ~25% of a standard passport photo page
        mrz_crop = image.crop((0, int(height * 0.75), width, height))
        grayscale = mrz_crop.convert("L")
        return pytesseract.image_to_string(grayscale, config="--psm 6")

    @staticmethod
    def _format_date(yymmdd):
        # mrz library returns YYMMDD; convert to ISO with a pivot year
        year = int(yymmdd[:2])
        full_year = 2000 + year if year <= 30 else 1900 + year
        return f"{full_year:04d}-{yymmdd[2:4]}-{yymmdd[4:6]}"