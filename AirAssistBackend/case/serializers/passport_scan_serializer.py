from rest_framework import serializers


class PassportScanSerializer(serializers.Serializer):
    file = serializers.ImageField()