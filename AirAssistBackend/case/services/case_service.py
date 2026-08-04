from integrations.distance_service import DistanceService
from .compensation_service import CompensationService
from user.models.models import User
from user.service.service import UserService
import secrets


class CaseService:

    @staticmethod
    def calculate_case_compensation(case):
        distance = DistanceService.calculate_orthodromic_distance(case.departure_airport, case.arrival_airport)
        amount  = CompensationService.calculate_compensation(distance)

        case.distance_km = distance
        case.compensation_amount = amount

        case.save()
        return case

    @staticmethod
    def create_passenger_account(passenger):
        # Check if a user with the same email already exists
        if User.objects.filter(email = passenger.email).exists():
            return

        #Generate initial password using Python's secrets module
        password = secrets.token_urlsafe(12)

        # Create a new user account for the passenger
        UserService.create_user(
            email = passenger.email,
            firstname = passenger.first_name,
            lastname = passenger.last_name,
            role_name = "PASSENGER",
            password = password,
            must_change_password = True
        )

        
