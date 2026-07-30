from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from ..models import Role, User


class RoleModelTests(TestCase):
    def test_role_field_configuration(self):
        field = Role._meta.get_field("role")

        self.assertEqual(field.max_length, 50)
        self.assertTrue(field.unique)

    def test_role_str_returns_role_name(self):
        role = Role.objects.create(role="Passenger")

        self.assertEqual(str(role), "Passenger")

    def test_role_name_must_be_unique(self):
        Role.objects.create(role="Passenger")

        with self.assertRaises(IntegrityError):
            Role.objects.create(role="Passenger")


class UserModelTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(role="Passenger")

    def test_user_field_configuration(self):
        role_field = User._meta.get_field("role")
        firstname_field = User._meta.get_field("firstname")
        lastname_field = User._meta.get_field("lastname")
        email_field = User._meta.get_field("email")
        password_field = User._meta.get_field("password")

        self.assertFalse(role_field.null)
        self.assertEqual(firstname_field.max_length, 20)
        self.assertEqual(lastname_field.max_length, 20)
        self.assertEqual(email_field.max_length, 50)
        self.assertTrue(email_field.unique)
        self.assertEqual(password_field.max_length, 255)

    def test_user_str_returns_full_name_and_email(self):
        user = User.objects.create(
            role=self.role,
            firstname="Jane",
            lastname="Doe",
            email="jane.doe@example.com",
            password="plain-password",
        )

        self.assertEqual(str(user), "Jane Doe (jane.doe@example.com)")

    def test_user_email_must_be_unique(self):
        User.objects.create(
            role=self.role,
            firstname="Jane",
            lastname="Doe",
            email="jane.doe@example.com",
            password="plain-password",
        )

        with self.assertRaises(IntegrityError):
            User.objects.create(
                role=self.role,
                firstname="John",
                lastname="Smith",
                email="jane.doe@example.com",
                password="plain-password",
            )

    def test_user_password_must_have_minimum_length(self):
        user = User(
            role=self.role,
            firstname="Jane",
            lastname="Doe",
            email="jane.doe@example.com",
            password="short",
        )

        with self.assertRaises(ValidationError) as context:
            user.full_clean()

        self.assertIn("password", context.exception.message_dict)