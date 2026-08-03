from integrations.distance_service import DistanceService
from .compensation_service import CompensationService

class CaseService:

    @staticmethod
    def calculate_case_compensation(case):
        distance = DistanceService.calculate_orthodromic_distance(case.departure_airport, case.arrival_airport)
        amount  = CompensationService.calculate_compensation(distance)

        case.distance_km = distance
        case.compensation_amount = amount

        case.save()
        return case