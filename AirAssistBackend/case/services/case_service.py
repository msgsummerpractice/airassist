from integrations.distance_service import DistanceService
from .compensation_service import CompensationService


class CaseService:

    @staticmethod
    def calculate_case_compensation(case):

        problem_flight = case.flights.filter(
            is_problem_flight=True
        ).first()

        if not problem_flight:
            raise ValueError(
                "No problem flight found for case"
            )

        distance = DistanceService.calculate_orthodromic_distance(
            problem_flight.departing_airport,
            problem_flight.destination_airport
        )

        amount = CompensationService.calculate_compensation(
            distance
        )

        case.distance_km = distance
        case.compensation_amount = amount

        case.save()

        return case