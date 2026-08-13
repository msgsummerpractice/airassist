import json

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from ..models.case import Case
from ..enums.case_state_enum import CaseState as State
from ..models.document import CaseDocument
from ..enums.document_type_enum import DocumentType
from ..models.flights import Flight
from ..models.disruption import Disruption
from user.models.users import User

from ..models.passengers import Passenger
from .disruption_serializer import DisruptionSerializer
from .flights_serializer import FlightsSerializer

from ..constants import MAX_FILE_SIZE, ALLOWED_EXTENSIONS, MAX_CONNECTION_FLIGHTS



class CaseCreationSerializer(serializers.Serializer):
    # flight itinerary
    flight_date = serializers.DateField()
    flight_number = serializers.CharField(max_length=20)
    airline = serializers.CharField(max_length=50)
    reservation_number = serializers.CharField(max_length=20)
    departing_airport = serializers.CharField(max_length=3)
    destination_airport = serializers.CharField(max_length=3)
    connection_flights = serializers.CharField(required=False, allow_blank=True)
    planned_departure_time = serializers.DateTimeField()
    planned_arrival_time = serializers.DateTimeField()
    is_problem_flight = serializers.BooleanField()
    is_main_flight = serializers.BooleanField()
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
    case_state = serializers.CharField(default=State.NEW.value, read_only=True)

    # disruption
    disruption = serializers.CharField(required=True)
   
    def validate_date_of_birth(self, value):
        if value >= timezone.now().date():
            raise serializers.ValidationError(
                "Date of birth must be in the past.")
        return value

    def validate_connection_flights(self, value):
        if not value:
            return []

        try:
            flights = json.loads(value)
        except json.JSONDecodeError:
            raise serializers.ValidationError(
                "Connection flights must be a valid JSON list.")

        if not isinstance(flights, list):
            raise serializers.ValidationError(
                "Connection flights must be a list.")

        if len(flights) > MAX_CONNECTION_FLIGHTS:
            raise serializers.ValidationError(
                "A maximum of 4 connection flights is allowed.")

        serializer = FlightsSerializer(data=flights, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def validate_disruption(self, value):
        try:
            disruption = json.loads(value)
        except json.JSONDecodeError:
            raise serializers.ValidationError(
                "Disruption must be valid JSON.")

        if not isinstance(disruption, dict):
            raise serializers.ValidationError(
                "Disruption must be an object.")

        serializer = DisruptionSerializer(data=disruption)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def validate(self, data):
        main_flight_problem = data.get("is_problem_flight")
        connection_flights = data.get("connection_flights", [])

        if connection_flights and connection_flights[0]["departing_airport"] != data["departing_airport"]:
            raise serializers.ValidationError(
                "The first connection flight must depart from the same airport as the main flight."
            )

        if connection_flights and connection_flights[-1]["destination_airport"] != data["destination_airport"]:
            raise serializers.ValidationError(
                "The last connection flight must arrive at the same airport as the main flight."
            )

        for i in range(len(connection_flights) - 1):
            if connection_flights[i]["destination_airport"] != connection_flights[i + 1]["departing_airport"]:
                raise serializers.ValidationError(
                        f"Connection flight {i + 1} destination must match connection flight {i + 2} departure airport."
                )

        all_problem_flights = []

        if main_flight_problem:
            all_problem_flights.append("main_flight")

        for flight in connection_flights:
            if flight.get("is_problem_flight"):
                all_problem_flights.append(flight)

        if len(all_problem_flights) != 1:
            raise serializers.ValidationError(
                "Exactly one flight (main or connecting) must be marked as a problem flight."
            )

        return data



    def validate_upload(self, value, field_name):
        if not value.name.lower().endswith(ALLOWED_EXTENSIONS):
            raise serializers.ValidationError(
                f"{field_name} must be a PDF or JPEG/JPG file."
            )

        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"{field_name} must be at most 5 MB."
            )

        return value

    def validate_boarding_pass(self, value):
        return self.validate_upload(value, "Boarding pass")

    def validate_passport(self, value):
        return self.validate_upload(value, "Passport")

    def validate_gdpr_consent(self, value):
        if not value:
            raise serializers.ValidationError("GDPR consent is required.")
        return value

    

    @transaction.atomic
    def create(self, validated_data):
        boarding_pass = validated_data.pop("boarding_pass")
        passport = validated_data.pop("passport")
        connection_flights = validated_data.pop("connection_flights", [])
        disruption = validated_data.pop("disruption")

        gdpr_consent = validated_data.get("gdpr_consent", False)
        case = Case.objects.create(
            status=State.NEW.value,
            gdpr_consent=gdpr_consent,
            gdpr_consent_at=timezone.now() if gdpr_consent else None,
            reservation_number=validated_data["reservation_number"],
            departure_airport=validated_data["departing_airport"],
            arrival_airport=validated_data["destination_airport"],
        )

        Disruption.objects.create(
            case=case,
            **disruption,
        )

        Flight.objects.create(
            case=case,
            flight_date=validated_data["flight_date"],
            flight_number=validated_data["flight_number"],
            airline=validated_data["airline"],
            reservation_number=validated_data["reservation_number"],
            departing_airport=validated_data["departing_airport"],
            destination_airport=validated_data["destination_airport"],
            planned_departure_time=validated_data["planned_departure_time"].time(),
            planned_arrival_time=validated_data["planned_arrival_time"].time(),
            is_problem_flight=validated_data["is_problem_flight"],
            is_main_flight=True,
        )

        for flight in connection_flights:
            Flight.objects.create(
                case=case,
                flight_date=flight["flight_date"],
                flight_number=flight["flight_number"],
                airline=flight["airline"],
                reservation_number=flight["reservation_number"],
                departing_airport=flight["departing_airport"],
                destination_airport=flight["destination_airport"],
                planned_departure_time=flight["planned_departure_time"].time(),
                planned_arrival_time=flight["planned_arrival_time"].time(),
                is_problem_flight=flight["is_problem_flight"],
                is_main_flight=False,
            )

        CaseDocument.objects.create(
            case=case,
            document_type=DocumentType.BOARDING_PASS.value,
            file=boarding_pass,
            original_filename=boarding_pass.name,
            content_type=getattr(boarding_pass, "content_type", ""),
            file_size=boarding_pass.size,
        )

        CaseDocument.objects.create(
            case=case,
            document_type=DocumentType.PASSPORT.value,
            file=passport,
            original_filename=passport.name,
            content_type=getattr(passport, "content_type", ""),
            file_size=passport.size,
        )
        passenger_data = {
            "first_name": validated_data.pop("first_name"),
            "last_name": validated_data.pop("last_name"),
            "date_of_birth": validated_data.pop("date_of_birth"),
            "email": validated_data.pop("email"),
            "phone": validated_data.pop("phone"),
            "address": validated_data.pop("address"),
            "postal_code": validated_data.pop("postal_code"),
            }
        

        validated_data.pop("flight_date")
        validated_data.pop("flight_number")
        validated_data.pop("airline")
        validated_data.pop("reservation_number")
        validated_data.pop("departing_airport")
        validated_data.pop("destination_airport")
        validated_data.pop("connection_flights", [])
        validated_data.pop("planned_departure_time")
        validated_data.pop("planned_arrival_time")
        validated_data.pop("is_problem_flight")

        Passenger.objects.create(case=case, **passenger_data)
        return case




