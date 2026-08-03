from enum import Enum

from django.db import models


class DisruptionMotive(Enum):
    CANCELATION = "CANCELATION"
    DELAY = "DELAY"
    DENIED_BOARDING = "DENIED_BOARDING"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]
