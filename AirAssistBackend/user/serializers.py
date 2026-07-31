from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import Role, User
from .service import UserService

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'role', 'firstname', 'lastname', 'email', 'password']

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role']

class LoginSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password']

    def validate(self, attrs):
        user = UserService.authenticate_user(email=attrs.get("email"), password=attrs.get("password"))
        if user is None:
            raise serializers.ValidationError({"detail":"forbidden"})
        attrs["user"] = user
        return attrs
