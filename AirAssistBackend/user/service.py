from .models import User, Role
from django.db import transaction


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

        user = User.objects.create(
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

