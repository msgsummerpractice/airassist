from rest_framework import serializers
from rest_framework.reverse import reverse

from ..enums.case_state_enum import CaseState
from ..models.case import Case
from ..models.document import CaseDocument
from ..models.flights import Flight
from ..models.passengers import Passenger
from .passenger_case_comment_serializer import PassengerCaseCommentSerializer


class PassengerCaseFlightSerializer(serializers.ModelSerializer):
	class Meta:
		model = Flight
		fields = [
			"flight_date",
			"flight_number",
			"airline",
			"reservation_number",
			"departing_airport",
			"destination_airport",
			"planned_departure_time",
			"planned_arrival_time",
		]


class PassengerCasePassengerSerializer(serializers.ModelSerializer):
	class Meta:
		model = Passenger
		fields = [
			"first_name",
			"last_name",
			"date_of_birth",
			"email",
			"phone",
			"address",
			"postal_code",
		]


class PassengerCaseDocumentSerializer(serializers.ModelSerializer):
	filename = serializers.CharField(source="original_filename", read_only=True)
	download_url = serializers.SerializerMethodField()

	class Meta:
		model = CaseDocument
		fields = [
			"id",
			"document_type",
			"filename",
			"uploaded_at",
			"uploaded_by",
			"download_url",
		]

	def get_download_url(self, obj):
		request = self.context.get("request")
		if request is None:
			return None

		return reverse(
			"passenger-case-document-download",
			kwargs={"pk": obj.case_id, "document_id": obj.id},
			request=request,
		)


class PassengerCaseDetailsSerializer(serializers.ModelSerializer):
	flight = serializers.SerializerMethodField()
	connecting_flights = serializers.SerializerMethodField()
	passenger = serializers.SerializerMethodField()
	documents = PassengerCaseDocumentSerializer(many=True, read_only=True)
	comments = PassengerCaseCommentSerializer(many=True, read_only=True)
	can_upload_documents = serializers.SerializerMethodField()

	class Meta:
		model = Case
		fields = [
			"id",
			"status",
			"conversation_status",
			"conversation_closed_at",
			"flight",
			"connecting_flights",
			"passenger",
			"documents",
			"can_upload_documents",
			"comments",
			"created_at",
			"updated_at",
		]

	def get_can_upload_documents(self, obj):
		return obj.status == CaseState.AWAITING_DOCUMENTS.value

	def get_flight(self, obj):
		main_flight = next(
			(flight for flight in obj.flights.all() if flight.is_main_flight),
			None,
		)

		if main_flight is None:
			main_flight = next(iter(obj.flights.all()), None)

		if main_flight is None:
			return None

		return PassengerCaseFlightSerializer(main_flight).data

	def get_connecting_flights(self, obj):
		flights = [flight for flight in obj.flights.all() if not flight.is_main_flight]
		return PassengerCaseFlightSerializer(flights, many=True).data

	def get_passenger(self, obj):
		request = self.context.get("request")
		if request is None or not getattr(request.user, "email", None):
			return None

		user_email = request.user.email.lower()
		passenger = next(
			(
				item
				for item in obj.passengers.all()
				if item.email and item.email.lower() == user_email
			),
			None,
		)

		if passenger is None:
			return None

		return PassengerCasePassengerSerializer(passenger).data
