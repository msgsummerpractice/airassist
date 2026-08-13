from rest_framework import serializers
from rest_framework.reverse import reverse

from ..enums.document_type_enum import DocumentType
from ..models.case import Case


class PassengerCaseListSerializer(serializers.ModelSerializer):
	flight_number = serializers.SerializerMethodField()
	passenger_name = serializers.SerializerMethodField()
	assignee = serializers.SerializerMethodField()
	contract_download_url = serializers.SerializerMethodField()

	class Meta:
		model = Case
		fields = ["id", "flight_number", "passenger_name", "status", "assignee", "contract_download_url"]

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

	def get_contract_download_url(self, obj):
		request = self.context.get("request")
		if request is None:
			return None

		has_contract = obj.documents.filter(
			document_type=DocumentType.CONTRACT.value,
		).exists()
		if not has_contract:
			return None

		return reverse(
			"case-contract-download",
			kwargs={"case_id": obj.id},
			request=request,
		)
