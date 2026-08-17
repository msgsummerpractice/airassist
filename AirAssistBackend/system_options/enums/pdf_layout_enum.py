from enum import Enum


class PdfLayout(Enum):
    STANDARD = "STANDARD"
    COMPACT = "COMPACT"
    DETAILED = "DETAILED"

    @classmethod
    def choices(cls):
        return [(layout.value, layout.name.title()) for layout in cls]
