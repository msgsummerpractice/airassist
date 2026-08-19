
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from airports.models.airport import Airport


def _airport_timezone(iata, field_name):
    airport = Airport.objects.filter(iata=iata).first()

    if not airport:
        raise serializers.ValidationError({
            field_name: f"Airport {iata} was not found."
        })

    if not airport.timezone or not airport.timezone.strip():
        raise serializers.ValidationError({
            field_name: f"Airport {iata} does not have timezone information. Please select another airport."
        })

    try:
        return ZoneInfo(airport.timezone)
    except ZoneInfoNotFoundError:
        raise serializers.ValidationError({
            field_name: f"Airport {iata} has invalid timezone information. Please select another airport."
        })


def validate_flight_times_in_airport_timezones(data):
    departure_timezone = _airport_timezone(
        data["departing_airport"],
        "departing_airport",
    )
    arrival_timezone = _airport_timezone(
        data["destination_airport"],
        "destination_airport",
    )

    departure_time = data["planned_departure_time"]
    arrival_time = data["planned_arrival_time"]

    departure_local = datetime.combine(
        departure_time.date(),
        departure_time.time(),
        departure_timezone,
    )
    arrival_local = datetime.combine(
        arrival_time.date(),
        arrival_time.time(),
        arrival_timezone,
    )

    if arrival_local.astimezone(timezone.utc) <= departure_local.astimezone(timezone.utc):
        raise serializers.ValidationError({
            "planned_arrival_time": "Arrival date and time must be after departure date and time."
        })



class FlightsSerializer(serializers.Serializer):
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
        validate_flight_times_in_airport_timezones(data)
        return data