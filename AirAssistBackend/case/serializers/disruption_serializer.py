from rest_framework import serializers

from ..models.disruption import Disruption


class DisruptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disruption
        fields = [
            "motive",
            "cancellation_type",
            "delay_type",
            "denied_boarding_type",
            "denied_boarding_reason",
            "airline_motive_mentioned",
            "airline_motive",
            "incident_description",
        ]