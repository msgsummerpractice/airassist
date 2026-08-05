import json

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models.case_disruption import Disruption
from .models.disruption_type import DisruptionMotive
from .models.cancellation_type import CancellationType
from .models.delay_type import DelayType
from .models.denied_boarding_type import DeniedBoardingType
from .models.denied_boarding_reason_type import DeniedBoardingReasonType
from .models.airline_motive_mentioned import AirlineMotiveMentioned
from .models.airline_motive import AirlineMotive

from .models.case_models import Case
from .models.case_state import CaseState as State
from .models.class_document import CaseDocument
from .models.document_type import DocumentType
from .models.flights_models import Flight
from user.models.models import User

from .models.case_passengers import Passenger

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = (".pdf", ".jpg", ".jpeg")


class ConnectionFlightSerializer(serializers.Serializer):
    flight_number = serializers.CharField(max_length=20)
    flight_date = serializers.DateField()
    airline = serializers.CharField(max_length=50)
    reservation_number = serializers.CharField(max_length=20)
    departing_airport = serializers.CharField(max_length=3)
    destination_airport = serializers.CharField(max_length=3)
    planned_departure_time = serializers.DateTimeField()
    planned_arrival_time = serializers.DateTimeField()
    is_problem_flight = serializers.BooleanField()

    def validate(self, data):
        if data["planned_arrival_time"] <= data["planned_departure_time"]:
            raise serializers.ValidationError({
                "planned_arrival_time": "Arrival date and time must be after departure date and time."
            })
        return data

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

    # disruption details
    disruption_motive = serializers.ChoiceField(
        choices=DisruptionMotive.choices(),
    )
    cancellation_type = serializers.ChoiceField(
        choices=CancellationType.choices(),
        required=False, allow_null=True, allow_blank=True,
    )
    delay_type = serializers.ChoiceField(
        choices=DelayType.choices(),
        required=False, allow_null=True, allow_blank=True,
    )
    denied_boarding_type = serializers.ChoiceField(
        choices=DeniedBoardingType.choices(),
        required=False, allow_null=True, allow_blank=True,
    )
    denied_boarding_reason = serializers.ChoiceField(
        choices=DeniedBoardingReasonType.choices(),
        required=False, allow_null=True, allow_blank=True,
    )
    airline_motive_mentioned = serializers.ChoiceField(
        choices=AirlineMotiveMentioned.choices(),
        required=False, allow_null=True, allow_blank=True,
    )
    airline_motive = serializers.ChoiceField(
        choices=AirlineMotive.choices(),
        required=False, allow_null=True, allow_blank=True,
    )
    incident_description = serializers.CharField(
        required=False, allow_blank=True,
    )

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
            if not isinstance(flights, list):
                raise serializers.ValidationError(
                    "Connection flights must be a list.")
            if len(flights) > 4:
                raise serializers.ValidationError(
                    "A maximum of 4 connection flights is allowed.")

            serializer = ConnectionFlightSerializer(data=flights, many=True)
            serializer.is_valid(raise_exception=True)
            return serializer.validated_data
        except json.JSONDecodeError:
            raise serializers.ValidationError(
                "Connection flights must be a valid JSON list.")

    def _validate_upload(self, value, field_name):
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
        return self._validate_upload(value, "Boarding pass")

    def validate_passport(self, value):
        return self._validate_upload(value, "Passport")

    def validate_gdpr_consent(self, value):
        if not value:
            raise serializers.ValidationError("GDPR consent is required.")
        return value

    def validate(self, data):
        main_flight_problem = data.get("is_problem_flight")
        connection_flights = data.get("connection_flights", [])

        departure_datetime = data.get("planned_departure_time")
        arrival_datetime = data.get("planned_arrival_time")

        motive = data.get("disruption_motive")

        # validate to ensure that sub-type fields match the disruption motive
        if motive == DisruptionMotive.CANCELATION.value and not data.get("cancellation_type"):
            raise serializers.ValidationError({"cancellation_type": "Required for cancellation disruptions."})
        
        if motive == DisruptionMotive.DELAY.value and not data.get("delay_type"):
            raise serializers.ValidationError({"delay_type": "Required for delay disruptions."})
        
        if motive == DisruptionMotive.DENIED_BOARDING.value and not data.get("denied_boarding_type"):
            raise serializers.ValidationError({"denied_boarding_type": "Required for denied boarding disruptions."})
        

        if arrival_datetime <= departure_datetime:
            raise serializers.ValidationError({
                "planned_arrival_time": "Arrival date and time must be after departure date and time."
            })

        # connection flights logic
        # departing airport = connection flight's first flight's departing airport
        if connection_flights and connection_flights[0]["departing_airport"] != data["departing_airport"]:
            raise serializers.ValidationError(
                "The first connection flight must depart from the same airport as the main flight."
            )
        # destination airport = connection flight's last flight's destination airport
        if connection_flights and connection_flights[-1]["destination_airport"] != data["destination_airport"]:
            raise serializers.ValidationError(
                "The last connection flight must arrive at the same airport as the main flight."
            )

        # connection flights are chained
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

    @transaction.atomic
    def create(self, validated_data):
        boarding_pass = validated_data.pop("boarding_pass")
        passport = validated_data.pop("passport")
        connection_flights = validated_data.pop("connection_flights", [])

        case = Case.objects.create(
            status=State.NEW.value,
            gdpr_consent=validated_data["gdpr_consent"],
            gdpr_consent_at=timezone.now(),
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
        
        validated_data.pop("boarding_pass")
        validated_data.pop("passport")

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

        # create disruption record
        Disruption.objects.create(
            case=case,
            motive=validated_data["disruption_motive"],
            cancellation_type=validated_data.get("cancellation_type") or None,
            delay_type=validated_data.get("delay_type") or None,
            denied_boarding_type=validated_data.get("denied_boarding_type") or None,
            denied_boarding_reason=validated_data.get("denied_boarding_reason") or None,
            airline_motive_mentioned=validated_data.get("airline_motive_mentioned") or None,
            airline_motive=validated_data.get("airline_motive") or None,
            incident_description=validated_data.get("incident_description", ""),
        )

        return case

class CaseEligibilitySerializer(serializers.Serializer):
    is_eligible = serializers.BooleanField()

class CaseAssignmentSerializer(serializers.Serializer):
    colleague_id = serializers.IntegerField()

    def validate_colleague_id(self, value):
        try:
            user = User.objects.select_related("role").get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Colleague does not exist.")

        if getattr(user.role, "role", None) != "Colleague":
            raise serializers.ValidationError("Selected user cannot be assigned to a case.")

        return value
