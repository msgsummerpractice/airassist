from .models import User, Role
from django.db import transaction
from django.contrib.auth.hashers import check_password
from .models import User

class UserService:
    @transaction.atomic
    @staticmethod
    def create_user(role_name: str, firstname: str, lastname: str, email: str, password: str) -> User:
        email = email.lower()

        if User.objects.filter(email=email).exists():
            raise ValueError(
                "There already exists a user with this email address")

        try:
            role = Role.objects.get(role=role_name)
        except Role.DoesNotExist:
            raise ValueError("This role does not exist")

        user = User.objects.create_user(
            role=role,
            firstname=firstname,
            lastname=lastname,
            email=email,
            password=password
        )
        return user

    @staticmethod
    def get_user_role(user_id):
        try:
            user = User.objects.get(pk=user_id)
            role = user.role
            return role
        except User.DoesNotExist:
            raise ValueError("user not found")

    @staticmethod
    def authenticate_user(email: str, password: str):
        email = (email or "").lower()
        user = User.objects.filter(email=email).first()
        if not user:
            return None
        if not check_password(password, user.password):
            return None
        return user