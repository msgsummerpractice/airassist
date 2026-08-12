from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from ..models.users import Role, User
from ..service.user_service import UserService

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # resolves "COLLEAGUE" / "PASSENGER" string to Role object for validated_data
    role = serializers.SlugRelatedField(slug_field='role', queryset=Role.objects.all())

    class Meta:
        model = User
        fields = ['id', 'firstname', 'lastname', 'email', 'password', 'role']

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role']

class LoginSerializer(serializers.ModelSerializer):
    email = serializers.CharField()
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

class UserListSerializer(serializers.ModelSerializer):
    role = serializers.StringRelatedField()
    assigned_case_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "firstname", "lastname", "email", "role", "assigned_case_count"]
        
