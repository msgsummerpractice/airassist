from enum import Enum

class DeniedBoardingType(Enum):
    YES = "YES"
    NO = "NO"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]
    