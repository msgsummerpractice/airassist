from django.db.models import Prefetch

from case.models.case import Case
from case.models.flights import Flight
from case.models.passengers import Passenger

class ColleagueCaseListService:
    @staticmethod
    def get_cases():
        return (
            Case.objects
            .select_related("assigned_colleague")
            .prefetch_related(
                Prefetch(
                    "passengers",
                    queryset=Passenger.objects.order_by("id"),
                    to_attr="prefetched_passengers",
                ),
                Prefetch(
                    "flights",
                    queryset=Flight.objects.filter(is_main_flight=True).order_by("id"),
                    to_attr="prefetched_main_flights",
                ),
            )
            .order_by("-created_at")
        )