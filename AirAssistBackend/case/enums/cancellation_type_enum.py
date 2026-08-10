from enum import Enum

class CancellationType(Enum):
    MORE_THAN_14_DAYS = "MORE_THAN_14_DAYS"
    LESS_THAN_14_DAYS = "LESS_THAN_14_DAYS"
    ON_FLIGHT_DAY = "ON_FLIGHT_DAY"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]

