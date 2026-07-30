from django.test import TestCase

from ..models import Role, User
from ..service import UserService


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
        self.assertEqual(user.password, "plain-password")

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
