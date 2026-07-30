from rest_framework import serializers

from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'role', 'first_name', 'last_name', 'email']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserRoleSerializer(serializers.ModelSerializer):
    roleId = serializers.IntegerField(source='role.roleId')
    role = serializers.CharField(source='role.role')

    class Meta:
        model = User
        fields = ['roleId', 'role']
