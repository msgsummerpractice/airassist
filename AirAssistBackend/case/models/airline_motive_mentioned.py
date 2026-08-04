from enum import Enum

class AirlineMotiveMentioned(Enum):
    YES = "YES"
    NO = "NO"
    I_DONT_KNOW = "I_DONT_KNOW"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]