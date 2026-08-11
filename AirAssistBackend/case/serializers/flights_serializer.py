
from rest_framework import serializers



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
        if data["planned_arrival_time"] <= data["planned_departure_time"]:
            raise serializers.ValidationError({
                "planned_arrival_time": "Arrival date and time must be after departure date and time."
            })
        return data