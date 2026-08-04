from enum import Enum

class CaseState(Enum):
    NEW = "NEW"
    VALID = "VALID"
    ASSIGNED = "ASSIGNED"
    INVALID = "INVALID"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]
