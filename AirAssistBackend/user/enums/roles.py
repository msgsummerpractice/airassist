from enum import Enum

class Roles(Enum):
    PASSENGER = "PASSENGER"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    COLLEAGUE = "COLLEAGUE"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]
