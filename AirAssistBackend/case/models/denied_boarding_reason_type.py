from enum import Enum

class DeniedBoardingReasonType(Enum):
    FLIGHT_OVERBOOKED = "FLIGHT_OVERBOOKED"
    AGGRESSIVE_BEHAVIOR = "AGGRESSIVE_BEHAVIOR"
    INTOXICATION = "INTOXICATION"
    UNSPECIFIED_REASON = "UNSPECIFIED_REASON"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]

    