from rest_framework import serializers

from ..enums.disruption_type_enum import DisruptionMotive
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

    def validate(self, data):
        motive = data.get("motive")

        if motive == DisruptionMotive.CANCELATION.value and not data.get("cancellation_type"):
            raise serializers.ValidationError({"cancellation_type": "Required for cancellation disruptions."})

        if motive == DisruptionMotive.DELAY.value and not data.get("delay_type"):
            raise serializers.ValidationError({"delay_type": "Required for delay disruptions."})

        if motive == DisruptionMotive.DENIED_BOARDING.value and not data.get("denied_boarding_type"):
            raise serializers.ValidationError({"denied_boarding_type": "Required for denied boarding disruptions."})

        return data