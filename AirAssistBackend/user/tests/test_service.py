from django.test import TestCase
from django.contrib.auth.hashers import check_password


from ..models.users import Role, User
from ..service.user_service import UserService

from rest_framework.test import APITestCase
from case.models.case import Case
from case.models.passengers import Passenger
from user.enums.roles import Roles


class UserServiceTests(TestCase):
    def test_create_user_creates_user_with_role_and_normalized_email(self):
        # Arrange
        role = Role.objects.create(role="Passenger")

        # Act
        user = UserService.create_user(
            role_name="Passenger",
            firstname="Jane",
            lastname="Doe",
            email="JANE.DOE@EXAMPLE.COM",
            password="plain-password",
        )

        # Assert
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(user.role, role)
        self.assertEqual(user.firstname, "Jane")
        self.assertEqual(user.lastname, "Doe")
        self.assertEqual(user.email, "jane.doe@example.com")
        self.assertTrue(check_password("plain-password", user.password))

    def test_create_user_raises_error_when_email_already_exists(self):
        # Arrange
        role = Role.objects.create(role="Passenger")
        User.objects.create(
            role=role,
            firstname="Existing",
            lastname="User",
            email="existing@example.com",
            password="plain-password",
        )

        # Act / Assert
        with self.assertRaises(ValueError) as context:
            UserService.create_user(
                role_name="Passenger",
                firstname="New",
                lastname="User",
                email="EXISTING@EXAMPLE.COM",
                password="plain-password",
            )

        self.assertEqual(
            str(context.exception),
            "There already exists a user with this email address",
        )
        self.assertEqual(User.objects.count(), 1)

    def test_create_user_raises_error_when_role_does_not_exist(self):
        # Arrange
        role_name = "Passenger"

        # Act / Assert
        with self.assertRaises(ValueError) as context:
            UserService.create_user(
                role_name=role_name,
                firstname="Jane",
                lastname="Doe",
                email="jane.doe@example.com",
                password="plain-password",
            )

        self.assertEqual(str(context.exception), "This role does not exist")
        self.assertEqual(User.objects.count(), 0)

    def test_get_user_role_returns_the_users_role(self):
        # Arrange
        role = Role.objects.create(role="Passenger")
        user = User.objects.create(
            role=role,
            firstname="Jane",
            lastname="Doe",
            email="jane.doe@example.com",
            password="plain-password",
        )

        # Act
        result = UserService.get_user_role(user.pk)

        # Assert
        self.assertEqual(result, role)

    def test_get_user_role_raises_error_when_user_does_not_exist(self):
        # Act / Assert
        with self.assertRaises(ValueError) as context:
            UserService.get_user_role(9999)

        self.assertEqual(str(context.exception), "user not found")


class UserDeleteServiceTests(TestCase):
    def setUp(self):
        self.system_admin_role = Role.objects.create(
            role=Roles.SYSTEM_ADMIN.value)
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)
        self.passenger_role = Role.objects.create(role=Roles.PASSENGER.value)

        self.admin = User.objects.create_user(
            role=self.system_admin_role,
            firstname="Admin",
            lastname="One",
            email="admin@example.com",
            password="admin-pass",
        )

    def test_delete_colleague_sets_case_assignee_to_null(self):
        colleague = User.objects.create_user(
            role=self.colleague_role,
            firstname="Col",
            lastname="League",
            email="colleague@example.com",
            password="col-pass",
        )
        linked_case = Case.objects.create(assigned_colleague=colleague)

        result = UserService.delete_user_account(
            requesting_user_id=self.admin.id,
            target_user_id=colleague.id,
        )

        self.assertEqual(result["deleted_user_role"], Roles.COLLEAGUE.value)
        self.assertFalse(User.objects.filter(id=colleague.id).exists())

        linked_case.refresh_from_db()
        self.assertIsNone(linked_case.assigned_colleague)

    def test_delete_passenger_deletes_case_passenger_rows(self):
        passenger_user = User.objects.create_user(
            role=self.passenger_role,
            firstname="Pas",
            lastname="Senger",
            email="passenger@example.com",
            password="pass-pass",
        )
        case_obj = Case.objects.create()
        Passenger.objects.create(
            case=case_obj,
            first_name="Pas",
            last_name="Senger",
            date_of_birth="1990-01-01",
            email="passenger@example.com",
        )

        result = UserService.delete_user_account(
            requesting_user_id=self.admin.id,
            target_user_id=passenger_user.id,
        )

        self.assertEqual(result["deleted_user_role"], Roles.PASSENGER.value)
        self.assertEqual(result["deleted_case_passenger_rows"], 1)
        self.assertFalse(User.objects.filter(id=passenger_user.id).exists())
        self.assertEqual(Passenger.objects.filter(
            email__iexact="passenger@example.com").count(), 0)

    def test_delete_blocks_self_delete(self):
        with self.assertRaises(ValueError) as context:
            UserService.delete_user_account(
                requesting_user_id=self.admin.id,
                target_user_id=self.admin.id,
            )
        self.assertEqual(str(context.exception),
                         "You cannot delete your own account.")

    def test_delete_blocks_system_admin_target(self):
        second_admin = User.objects.create_user(
            role=self.system_admin_role,
            firstname="Admin",
            lastname="Two",
            email="admin2@example.com",
            password="admin-pass",
        )

        with self.assertRaises(ValueError) as context:
            UserService.delete_user_account(
                requesting_user_id=self.admin.id,
                target_user_id=second_admin.id,
            )
        self.assertEqual(str(context.exception),
                         "System admin accounts cannot be deleted.")

    def test_delete_returns_not_found_for_missing_user(self):
        with self.assertRaises(ValueError) as context:
            UserService.delete_user_account(
                requesting_user_id=self.admin.id,
                target_user_id=999999,
            )
        self.assertEqual(str(context.exception), "User not found.")


class UserDeleteApiTests(APITestCase):
    def setUp(self):
        self.system_admin_role = Role.objects.create(
            role=Roles.SYSTEM_ADMIN.value)
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)

        self.admin = User.objects.create_user(
            role=self.system_admin_role,
            firstname="Admin",
            lastname="One",
            email="admin@example.com",
            password="admin-pass",
        )
        self.colleague = User.objects.create_user(
            role=self.colleague_role,
            firstname="Col",
            lastname="League",
            email="colleague@example.com",
            password="col-pass",
        )

    def test_non_admin_cannot_delete_user(self):
        self.client.force_authenticate(user=self.colleague)
        response = self.client.delete(f"/user/{self.admin.id}/delete/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_delete_colleague(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/user/{self.colleague.id}/delete/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get("message"),
                         "User account deleted successfully.")
        self.assertFalse(User.objects.filter(id=self.colleague.id).exists())

    def test_admin_cannot_self_delete(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/user/{self.admin.id}/delete/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data.get("message"),
                         "You cannot delete your own account.")

    def test_delete_missing_user_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete("/user/999999/delete/")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data.get("message"), "User not found.")


class UserProfileUpdateApiTests(APITestCase):
    def setUp(self):
        self.system_admin_role = Role.objects.create(
            role=Roles.SYSTEM_ADMIN.value)
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)
        self.passenger_role = Role.objects.create(role=Roles.PASSENGER.value)
        self.admin = User.objects.create_user(
            role=self.system_admin_role,
            firstname="Admin",
            lastname="One",
            email="admin@example.com",
            password="admin-pass",
        )
        self.colleague = User.objects.create_user(
            role=self.colleague_role,
            firstname="Col",
            lastname="League",
            email="colleague@example.com",
            password="col-pass",
        )
        self.passenger = User.objects.create_user(
            role=self.passenger_role,
            firstname="Pas",
            lastname="Senger",
            email="passenger@example.com",
            password="pass-pass",
        )

    def test_admin_can_update_passenger_profile_and_linked_case_passenger(self):
        case_obj = Case.objects.create()
        case_passenger = Passenger.objects.create(
            case=case_obj,
            first_name="Pas",
            last_name="Senger",
            date_of_birth="1990-01-01",
            email="passenger@example.com",
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/user/{self.passenger.id}/profile/",
            {
                "firstname": "Pat",
                "lastname": "Smith",
                "email": "PAT.SMITH@EXAMPLE.COM",
                "role": Roles.COLLEAGUE.value,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["firstname"], "Pat")
        self.assertEqual(response.data["lastname"], "Smith")
        self.assertEqual(response.data["email"], "pat.smith@example.com")
        self.assertEqual(response.data["role"], Roles.PASSENGER.value)

        self.passenger.refresh_from_db()
        case_passenger.refresh_from_db()
        self.assertEqual(self.passenger.email, "pat.smith@example.com")
        self.assertEqual(case_passenger.first_name, "Pat")
        self.assertEqual(case_passenger.last_name, "Smith")
        self.assertEqual(case_passenger.email, "pat.smith@example.com")

    def test_non_admin_cannot_update_user(self):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.patch(
            f"/user/{self.passenger.id}/profile/",
            {"firstname": "Pat", "lastname": "Smith", "email": "pat@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_cannot_update_user_with_existing_email(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/user/{self.passenger.id}/profile/",
            {
                "firstname": "Pat",
                "lastname": "Smith",
                "email": self.colleague.email,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
