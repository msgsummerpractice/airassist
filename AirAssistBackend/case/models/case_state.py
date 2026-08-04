from enum import Enum

from django.db import models
    

class CaseState(Enum):
    NEW = "NEW"
    VALID = "VALID"
    ASSIGNED = "ASSIGNED"
    INVALID = "INVALID"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]
