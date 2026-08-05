from enum import Enum

class AirlineMotive(Enum):
    TECHNICAL_PROBLEM = "TECHNICAL_PROBLEM"
    METEOROLOGICAL_CONDITIONS = "METEOROLOGICAL_CONDITIONS"
    STRIKE = "STRIKE"
    AIRPORT_PROBLEMS = "AIRPORT_PROBLEMS"
    CREW_PROBLEMS = "CREW_PROBLEMS"
    OTHER = "OTHER"

    @classmethod
    def choices(cls):
        return [(state.value, state.name.title()) for state in cls]