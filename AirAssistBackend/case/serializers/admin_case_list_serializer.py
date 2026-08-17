from rest_framework import serializers

from ..models.case import Case


class AdminCaseListSerializer(serializers.ModelSerializer):
    case_date = serializers.DateTimeField(source="created_at", read_only=True)
    flight_number = serializers.SerializerMethodField()
    flight_date = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            "id",
            "case_date",
            "flight_number",
            "flight_date",
            "status",
        ]

    def get_flight_number(self, obj):
        flight = self._get_main_flight(obj)
        return flight.flight_number if flight else None

    def get_flight_date(self, obj):
        flight = self._get_main_flight(obj)
        return flight.flight_date.isoformat() if flight else None

    @staticmethod
    def _get_main_flight(obj):
        flights = getattr(obj, "prefetched_main_flights", None)
        return flights[0] if flights else None