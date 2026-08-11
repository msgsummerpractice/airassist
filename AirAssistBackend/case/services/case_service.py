from airports.services.distance_service import DistanceService
from .compensation_service import CompensationService
from user.models.users import User
from user.service.user_service import UserService
import secrets
from ..constants import *

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

    @staticmethod
    def create_passenger_account(passenger):
        if User.objects.filter(email = passenger.email).exists():
            return

        password = secrets.token_urlsafe(PASSWORD_SIZE)

        UserService.create_user(
            email = passenger.email,
            firstname = passenger.first_name,
            lastname = passenger.last_name,
            role_name = "PASSENGER",
            password = password,
            must_change_password = True
        )
