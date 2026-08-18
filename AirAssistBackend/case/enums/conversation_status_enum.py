from enum import Enum


class ConversationStatus(Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

    @classmethod
    def choices(cls):
        return [(status.value, status.name.title()) for status in cls]
