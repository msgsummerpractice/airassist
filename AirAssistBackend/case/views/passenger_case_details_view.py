from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from user.permissions import IsPassenger

from ..models.case import Case
from ..models.document import CaseDocument
from ..models.flights import Flight
from ..models.passengers import Passenger
from ..serializers.passenger_case_details_serializer import (
	PassengerCaseDetailsSerializer,
)


class PassengerCaseDetailsView(generics.RetrieveAPIView):
	serializer_class = PassengerCaseDetailsSerializer
	permission_classes = [IsAuthenticated, IsPassenger]

	def get_queryset(self):
		user_email = self.request.user.email.lower()

		return (
			Case.objects.filter(passengers__email__iexact=user_email)
			.prefetch_related(
				Prefetch(
					"passengers",
					queryset=Passenger.objects.filter(email__iexact=user_email),
				),
				Prefetch(
					"flights",
					queryset=Flight.objects.order_by(
						"-is_main_flight",
						"flight_date",
						"planned_departure_time",
					),
				),
				Prefetch(
					"documents",
					queryset=CaseDocument.objects.order_by("-uploaded_at", "-id"),
				),
			)
			.distinct()
		)
