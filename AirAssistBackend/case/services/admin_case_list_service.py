from django.db.models import Prefetch

from ..models.case import Case
from ..models.flights import Flight


class AdminCaseListService:
    @staticmethod
    def get_cases():
        return (
            Case.objects.prefetch_related(
                Prefetch(
                    "flights",
                    queryset=Flight.objects.filter(is_main_flight=True).order_by("id"),
                    to_attr="prefetched_main_flights",
                )
            )
            .order_by("-created_at")
        )