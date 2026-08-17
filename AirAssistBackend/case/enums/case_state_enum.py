from enum import Enum

from django.db import models
    

class CaseState(Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    ELIGIBLE = "ELIGIBLE"
    NON_ELIGIBLE = "NON_ELIGIBLE"
    AWAITING_DOCUMENTS = "AWAITING_DOCUMENTS"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]
