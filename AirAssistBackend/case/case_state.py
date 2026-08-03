from enum import Enum

class CaseState(Enum):
    NEW = "New"
    VALID = "Eligible"
    ASSIGNED = "Assigned"
    INVALID = "Invalid"