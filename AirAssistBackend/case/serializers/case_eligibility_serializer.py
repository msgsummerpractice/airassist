from rest_framework import serializers


class CaseEligibilitySerializer(serializers.Serializer):
    is_eligible = serializers.BooleanField()