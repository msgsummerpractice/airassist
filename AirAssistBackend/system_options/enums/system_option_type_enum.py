from enum import Enum


class SystemOptionType(Enum):
    EMAIL_PRESET = "EMAIL_PRESET"
    PDF_PRESET = "PDF_PRESET"

    @classmethod
    def choices(cls):
        return [(option.value, option.name.title()) for option in cls]
