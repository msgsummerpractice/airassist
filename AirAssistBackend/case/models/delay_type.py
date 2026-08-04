from enum import Enum

class DelayType(Enum):
    LESS_THAN_3_HOURS = "LESS_THAN_3_HOURS"
    MORE_THAN_3_HOURS = "MORE_THAN_3_HOURS"
    CONNECTION_FLIGHT_LOST = "CONNECTION_FLIGHT_LOST"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]

