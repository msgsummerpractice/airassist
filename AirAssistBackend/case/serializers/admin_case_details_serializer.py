from rest_framework import serializers

from .passenger_case_comment_serializer import PassengerCaseCommentSerializer
from .passenger_case_details_serializer import (
    PassengerCaseDocumentSerializer,
    PassengerCaseFlightSerializer,
    PassengerCasePassengerSerializer,
)
from ..models.case import Case


class AdminCaseDetailsSerializer(serializers.ModelSerializer):
    flight = serializers.SerializerMethodField()
    connecting_flights = serializers.SerializerMethodField()
    passenger = serializers.SerializerMethodField()
    documents = PassengerCaseDocumentSerializer(many=True, read_only=True)
    comments = PassengerCaseCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = [
            "id",
            "status",
            "flight",
            "connecting_flights",
            "passenger",
            "documents",
            "comments",
            "created_at",
            "updated_at",
        ]

    def get_flight(self, obj):
        main_flight = next(
            (flight for flight in obj.flights.all() if flight.is_main_flight),
            None,
        )
        main_flight = main_flight or next(iter(obj.flights.all()), None)
        return PassengerCaseFlightSerializer(main_flight).data if main_flight else None

    def get_connecting_flights(self, obj):
        flights = [flight for flight in obj.flights.all() if not flight.is_main_flight]
        return PassengerCaseFlightSerializer(flights, many=True).data

    def get_passenger(self, obj):
        passenger = next(iter(obj.passengers.all()), None)
        return PassengerCasePassengerSerializer(passenger).data if passenger else None