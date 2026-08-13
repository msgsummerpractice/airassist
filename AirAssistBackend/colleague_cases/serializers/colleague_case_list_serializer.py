from rest_framework import serializers

from case.models.case import Case


class ColleagueCaseListSerializer(serializers.ModelSerializer):
    case_date = serializers.DateTimeField(source="created_at", read_only=True)
    passenger_name = serializers.SerializerMethodField()
    flight_number = serializers.SerializerMethodField()
    flight_date = serializers.SerializerMethodField()
    assigned_colleague_name = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            "id",
            "case_date",
            "flight_number",
            "flight_date",
            "passenger_name",
            "status",
            "assigned_colleague_id",
            "assigned_colleague_name",
        ]

    def get_passenger_name(self, obj):
        passengers = getattr(obj, "prefetched_passengers", None)
        passenger = passengers[0] if passengers else obj.passengers.first()

        if passenger is None:
            return None

        return f"{passenger.first_name} {passenger.last_name}".strip()

    def get_flight_number(self, obj):
        flight = self.get_main_flight(obj)

        if flight is None:
            return None

        return flight.flight_number

    def get_flight_date(self, obj):
        flight = self.get_main_flight(obj)

        if flight is None:
            return None

        return flight.flight_date

    def get_assigned_colleague_name(self, obj):
        colleague = obj.assigned_colleague

        if colleague is None:
            return None

        return f"{colleague.firstname} {colleague.lastname}".strip()

    def get_main_flight(self, obj):
        flights = getattr(obj, "prefetched_main_flights", None)

        if flights:
            return flights[0]

        return obj.flights.filter(is_main_flight=True).first()