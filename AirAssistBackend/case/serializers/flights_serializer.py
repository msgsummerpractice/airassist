
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


def flight_time_as_airport_utc(data, time_field, airport_field):
    airport_timezone = _airport_timezone(data[airport_field], airport_field)
    flight_time = data[time_field]

    local_time = datetime.combine(
        flight_time.date(),
        flight_time.time(),
        airport_timezone,
    )

    return local_time.astimezone(timezone.utc)


def validate_flight_times_in_airport_timezones(data):
    departure_utc = flight_time_as_airport_utc(
        data,
        "planned_departure_time",
        "departing_airport",
    )
    arrival_utc = flight_time_as_airport_utc(
        data,
        "planned_arrival_time",
        "destination_airport",
    )

    if arrival_utc <= departure_utc:
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