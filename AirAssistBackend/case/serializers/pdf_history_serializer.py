from rest_framework import serializers

from ..models.document import CaseDocument


class PdfHistorySerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(
        source="original_filename", read_only=True)
    passenger_name = serializers.SerializerMethodField()
    case_id = serializers.IntegerField(source="case.id", read_only=True)

    class Meta:
        model = CaseDocument
        fields = ["id", "document_name", "passenger_name",
                  "case_id", "document_type", "uploaded_at"]

    def get_passenger_name(self, obj):
        passengers = getattr(obj.case, "prefetched_passengers", None)
        passenger = passengers[0] if passengers else None
        if passenger is None:
            return None
        return f"{passenger.first_name} {passenger.last_name}"
