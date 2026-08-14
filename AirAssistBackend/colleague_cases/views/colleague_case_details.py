from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from case.models.case import Case
from case.models.comment import Comment
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger

from ..permissions import IsColleague
from ..serializers.colleague_case_details_serialiser import ColleagueCaseDetailsSerializer

class ColleagueCaseDetailsView(generics.RetrieveAPIView):
    serializer_class = ColleagueCaseDetailsSerializer
    permission_classes = [IsAuthenticated, IsColleague]

    def get_queryset(self):
        return (
            Case.objects.all()
            .prefetch_related(
                Prefetch(
                    "passengers",
                    queryset=Passenger.objects.order_by("id"),
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
                Prefetch(
                    "comments",
                    queryset=Comment.objects.select_related(
                        "author",
                        "author__role",
                    ).order_by("created_at", "id"),
                ),
            )
            .distinct()
        )