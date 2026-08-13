from rest_framework import serializers

from ..models.case import Case


class PassengerCaseListSerializer(serializers.ModelSerializer):
	flight_number = serializers.SerializerMethodField()
	passenger_name = serializers.SerializerMethodField()
	assignee = serializers.SerializerMethodField()

	class Meta:
		model = Case
		fields = ["id", "flight_number", "passenger_name", "status", "assignee"]

	def get_flight_number(self, obj):
		main_flight = next((flight for flight in obj.flights.all() if flight.is_main_flight), None)
		return main_flight.flight_number if main_flight else None

	def get_passenger_name(self, obj):
		request = self.context.get("request")
		if request is None or not getattr(request.user, "email", None):
			return None

		user_email = request.user.email.lower()
		passenger = next(
			(item for item in obj.passengers.all() if item.email.lower() == user_email),
			None,
		)
		if passenger is None:
			return None

		return f"{passenger.first_name} {passenger.last_name}"

	def get_assignee(self, obj):
		assignee = obj.assigned_colleague
		if assignee is None:
			return None
		return f"{assignee.firstname} {assignee.lastname}"
