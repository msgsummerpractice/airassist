from datetime import date, datetime, time, timezone

from django.test import TestCase

from case.models.case import Case
from case.models.flights import Flight
from case.models.passengers import Passenger

from colleague_cases.services.colleague_case_list_service import (
    ColleagueCaseListService,
)


class ColleagueCaseListServiceTests(TestCase):
    def create_passenger(self, case, first_name, last_name):
        return Passenger.objects.create(
            case=case,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date(1990, 1, 1),
            email=f"{first_name.lower()}@example.com",
            phone="1234567890",
            address="Main Street 1",
            postal_code="12345",
        )

    def create_flight(self, case, flight_number, is_main_flight):
        return Flight.objects.create(
            case=case,
            flight_date=date(2026, 8, 3),
            flight_number=flight_number,
            airline="Lufthansa",
            reservation_number="ABC123",
            departing_airport="OTP",
            destination_airport="FRA",
            planned_departure_time=time(10, 0),
            planned_arrival_time=time(12, 0),
            is_problem_flight=is_main_flight,
            is_main_flight=is_main_flight,
        )

    def test_get_cases_returns_cases_ordered_by_created_at_descending(self):
        case_older = Case.objects.create(gdpr_consent=True)
        case_newer = Case.objects.create(gdpr_consent=True)
        Case.objects.filter(pk=case_older.pk).update(
            created_at=datetime(2025, 1, 1, 10, 0, tzinfo=timezone.utc),
        )
        Case.objects.filter(pk=case_newer.pk).update(
            created_at=datetime(2025, 1, 2, 10, 0, tzinfo=timezone.utc),
        )
        case_older.refresh_from_db()
        case_newer.refresh_from_db()

        result = ColleagueCaseListService.get_cases()

        self.assertEqual(list(result), [case_newer, case_older])

    def test_get_cases_prefetches_passengers(self):
        case = Case.objects.create(gdpr_consent=True)

        passenger_1 = self.create_passenger(case, first_name="Ada", last_name="Lovelace")
        passenger_2 = self.create_passenger(case, first_name="Grace", last_name="Hopper")

        result = ColleagueCaseListService.get_cases()

        result_case = result.get(id=case.id)

        self.assertEqual(result_case.prefetched_passengers, [passenger_1, passenger_2])

    def test_get_cases_prefetches_only_main_flights(self):
        case = Case.objects.create(gdpr_consent=True)

        main_flight = self.create_flight(case, flight_number="LH123", is_main_flight=True)
        secondary_flight = self.create_flight(case, flight_number="LH456", is_main_flight=False)

        result = ColleagueCaseListService.get_cases()

        result_case = result.get(id=case.id)

        self.assertEqual(result_case.prefetched_main_flights, [main_flight])
        self.assertNotIn(secondary_flight, result_case.prefetched_main_flights)

    def test_get_cases_orders_main_flights_by_id(self):
        case = Case.objects.create(gdpr_consent=True)

        flight_1 = self.create_flight(case, flight_number="LH123", is_main_flight=True)
        flight_2 = self.create_flight(case, flight_number="LH456", is_main_flight=True)

        result = ColleagueCaseListService.get_cases()

        result_case = result.get(id=case.id)

        self.assertEqual(result_case.prefetched_main_flights, [flight_1, flight_2])