from rest_framework import serializers

from AirAssistBackend.user.models.users import User


class CaseAssignmentSerializer(serializers.Serializer):
    colleague_id = serializers.IntegerField()

    def validate_colleague_id(self, value):
        try:
            user = User.objects.select_related("role").get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Colleague does not exist.")

        if getattr(user.role, "role", None) != "Colleague":
            raise serializers.ValidationError("Selected user cannot be assigned to a case.")

        return value