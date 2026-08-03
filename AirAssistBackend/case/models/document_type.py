from enum import Enum


class DocumentType(Enum):
    BOARDING_PASS = "BOARDING_PASS"
    PASSPORT = "PASSPORT"

    @classmethod
    def choices(cls):
        return [(item.value, item.name.title()) for item in cls]