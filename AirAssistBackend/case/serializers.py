from rest_framework import serializers
from django.utils import timezone
import json
import uuid


class MockCase:
    def __init__(self):
        self.id = uuid.uuid4()
        self.status = 'NEW'
        self.created_at = timezone.now()

class CaseCreationSerializer(serializers.Serializer):
    # flight itinerary
    flight_date = serializers.DateField()
    flight_number = serializers.CharField(max_length=20)
    airline = serializers.CharField(max_length=50)
    reservation_number = serializers.CharField(max_length=20)
    departing_airport = serializers.CharField(max_length=3)
    destination_airport = serializers.CharField(max_length=3)
    connection_flights = serializers.CharField(required=False, allow_blank=True)
    planned_departure_time = serializers.TimeField()
    planned_arrival_time = serializers.TimeField()
    is_problem_flight = serializers.BooleanField()

    # passenger details
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    date_of_birth = serializers.DateField()
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)
    address = serializers.CharField(max_length=200)
    postal_code = serializers.CharField(max_length=10)

    # documents
    boarding_pass = serializers.FileField(required=True)  
    passport = serializers.FileField(required=True)

    # GDPR consent
    gdpr_consent = serializers.BooleanField()

    def validate_date_of_birth(self, value):
        if value >= timezone.now().date():
            raise serializers.ValidationError("Date of birth must be in the past.")
        return value

    def validate_gdpr_consent(self, value):
        if not value:
            raise serializers.ValidationError("GDPR consent is required.")
        return value


    def validate_connection_flights(self, value):
        if not value:
            return []
        try:
            flights = json.loads(value)
            if not isinstance(flights, list):
                raise serializers.ValidationError("Connection flights must be a list.")
            if len(flights) > 4:
                raise serializers.ValidationError("A maximum of 4 connection flights is allowed.")
            return flights
        except json.JSONDecodeError:
            raise serializers.ValidationError("Connection flights must be a valid JSON list.")

    def validate(self, data):
        main_flight_problem = data.get("is_problem_flight")
        connection_flights = data.get("connection_flights", [])

        all_problem_flights = []

        if main_flight_problem:
            all_problem_flights.append("main_flight")

        for flight in connection_flights:
            if flight.get("is_problem_flight"):
                all_problem_flights.append(flight)

        if len(all_problem_flights) != 1:
            raise serializers.ValidationError("Exactly one flight (main or connecting) must be marked as a problem flight.")
        
        return data

    def create(self, validated_data):
        # 1. Pop passenger data and create Passenger
        # 2. Pop file data, save them
        # 3. Create Case object (Status defaults to NEW)
        # 4. Create Main Flight
        # 5. Loop through validated_data['connecting_flights'] and create those Flights
        # 6. Return the created Case
        return MockCase()