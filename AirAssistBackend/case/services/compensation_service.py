from .compensation_constants import (
    EU261_FIRST_THRESHOLD,
    EU261_SECOND_THRESHOLD,
    EU261_SHORT_COMPENSATION,
    EU261_MEDIUM_COMPENSATION,
    EU261_LONG_COMPENSATION,
)


class CompensationService:

    @staticmethod
    def calculate_compensation(distance_km):

        if distance_km <= EU261_FIRST_THRESHOLD:
            return EU261_SHORT_COMPENSATION

        elif distance_km <= EU261_SECOND_THRESHOLD:
            return EU261_MEDIUM_COMPENSATION

        else:
            return EU261_LONG_COMPENSATION