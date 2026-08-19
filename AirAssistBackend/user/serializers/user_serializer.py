from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from ..models.users import Role, User
from ..service.user_service import UserService


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # resolves "COLLEAGUE" / "PASSENGER" string to Role object for validated_data
    role = serializers.SlugRelatedField(
        slug_field='role', queryset=Role.objects.all())

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
        user = UserService.authenticate_user(
            email=attrs.get("email"), password=attrs.get("password"))
        if user is None:
            raise serializers.ValidationError({"detail": "forbidden"})
        attrs["user"] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class UserListSerializer(serializers.ModelSerializer):
    role = serializers.StringRelatedField()
    assigned_case_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "firstname", "lastname",
                  "email", "role", "assigned_case_count"]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["firstname", "lastname", "email"]

    def validate_email(self, value):
        normalized_email = value.lower()
        existing_user = User.objects.filter(email__iexact=normalized_email).exclude(
            pk=self.instance.pk
        )
        if existing_user.exists():
            raise serializers.ValidationError(
                "There already exists a user with this email address."
            )
        return normalized_email
