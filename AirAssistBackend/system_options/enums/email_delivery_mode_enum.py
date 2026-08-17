from enum import Enum


class EmailDeliveryMode(Enum):
    SMTP = "SMTP"
    SENDGRID_API = "SENDGRID_API"
    MICROSOFT_GRAPH = "MICROSOFT_GRAPH"

    @classmethod
    def choices(cls):
        return [(mode.value, mode.name.title()) for mode in cls]
