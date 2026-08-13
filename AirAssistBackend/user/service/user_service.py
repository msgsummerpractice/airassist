from ..models.users import User, Role
from django.db import transaction
from django.contrib.auth.hashers import check_password
from ..models.users import User
from case_email.services.email_service import send_user_created_email
from django.db.models import (
    Count, IntegerField, Subquery, OuterRef, Case as DbCase, When,
)
from django.db.models.functions import Coalesce
from case.models.passengers import Passenger
from ..enums.roles import Roles
from django.db import transaction
from case.models.passengers import Passenger



class UserService:
    @transaction.atomic
    @staticmethod
    def create_user(role_name: str, firstname: str, lastname: str, email: str, password: str, must_change_password = False) -> User:
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

        user.must_change_password = must_change_password
        user.save(update_fields=["must_change_password"])
        send_user_created_email(user,password)

        return user

    @transaction.atomic
    @staticmethod
    def delete_user_account(requesting_user_id: int, target_user_id: int) -> dict:
        try:
            target_user = User.objects.select_related("role").get(pk=target_user_id)
        except User.DoesNotExist:
            raise ValueError("User not found.")
    
        if requesting_user_id == target_user.id:
            raise ValueError("You cannot delete your own account.")
    
        role_name = getattr(target_user.role, "role", None)
    
        if role_name == Roles.SYSTEM_ADMIN.value:
            raise ValueError("System admin accounts cannot be deleted.")
    
        if role_name not in {Roles.COLLEAGUE.value, Roles.PASSENGER.value}:
            raise ValueError("Only colleague and passenger accounts can be deleted.")
    
        deleted_passenger_rows = 0
        if role_name == Roles.PASSENGER.value:
            passenger_qs = Passenger.objects.filter(email__iexact=target_user.email)
            deleted_passenger_rows = passenger_qs.count()
            passenger_qs.delete()
    
        deleted_user_id = target_user.id
        deleted_user_email = target_user.email
        deleted_user_role = role_name
        target_user.delete()
    
        return {
            "deleted_user_id": deleted_user_id,
            "deleted_user_email": deleted_user_email,
            "deleted_user_role": deleted_user_role,
            "deleted_case_passenger_rows": deleted_passenger_rows,
        }

            

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

    

    @staticmethod
    def get_users_for_admin_list():
        passenger_case_subq = (
            Passenger.objects
            .filter(email=OuterRef("email"))
            .values("email")
            .annotate(cnt=Count("id"))
            .values("cnt")
        )

        return (
            User.objects
            .filter(role__role__in=[Roles.COLLEAGUE.value, Roles.PASSENGER.value])
            .annotate(
                assigned_case_count=DbCase(
                    When(
                        role__role=Roles.COLLEAGUE.value,
                        then=Count("assigned_cases"),
                    ),
                    When(
                        role__role=Roles.PASSENGER.value,
                        then=Coalesce(
                            Subquery(passenger_case_subq, output_field=IntegerField()),
                            0,
                        ),
                    ),
                    default=0,
                    output_field=IntegerField(),
                )
            )
            .order_by("lastname", "firstname")
        )