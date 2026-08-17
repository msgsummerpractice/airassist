from django.db.models import Prefetch, Q
from ..models.document import CaseDocument
from ..models.passengers import Passenger


class PdfHistoryService:
    @staticmethod
    def get_documents(filters=None):
        filters = filters or {}

        queryset = (
            CaseDocument.objects.select_related("case").prefetch_related(
                Prefetch(
                    "case__passengers",
                    queryset=Passenger.objects.order_by("id"),
                    to_attr="prefetched_passengers",
                )
            )
            .order_by("-uploaded_at")
        )

        case_id = filters.get("case_id")
        if case_id:
            queryset = queryset.filter(case_id=case_id)

        document_type = filters.get("document_type")
        if document_type:
            queryset = queryset.filter(document_type=document_type)

        passenger_name = filters.get("passenger_name")
        if passenger_name:
            queryset = queryset.filter(
                Q(case__passengers__first_name__icontains=passenger_name)
                | Q(case__passengers__last_name__icontains=passenger_name)
            ).distinct()

        uploaded_from = filters.get("uploaded_from")
        if uploaded_from:
            queryset = queryset.filter(uploaded_at__date__gte=uploaded_from)

        uploaded_to = filters.get("uploaded_to")
        if uploaded_to:
            queryset = queryset.filter(uploaded_at__date__lte=uploaded_to)

        return queryset
