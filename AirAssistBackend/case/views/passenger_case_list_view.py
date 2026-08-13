from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from user.permissions import IsPassenger

from ..models.case import Case
from ..models.flights import Flight
from ..models.passengers import Passenger
from ..serializers.passenger_case_list_serializer import PassengerCaseListSerializer


class PassengerCaseListView(generics.ListAPIView):
    serializer_class = PassengerCaseListSerializer
    permission_classes = [IsAuthenticated, IsPassenger]

    def get_queryset(self):
        user_email = self.request.user.email.lower()

        queryset = (
            Case.objects.filter(passengers__email__iexact=user_email)
            .select_related("assigned_colleague")
            .prefetch_related(
                Prefetch("passengers", queryset=Passenger.objects.filter(email__iexact=user_email)),
                Prefetch("flights", queryset=Flight.objects.filter(is_main_flight=True)),
            )
            .distinct()
        )

        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value.upper())

        assignee_id = self.request.query_params.get("assignee_id")
        if assignee_id:
            queryset = queryset.filter(assigned_colleague_id=assignee_id)

        ordering = self.request.query_params.get("ordering", "-created_at")
        allowed_ordering = {"created_at", "-created_at", "status", "-status", "id", "-id"}
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset