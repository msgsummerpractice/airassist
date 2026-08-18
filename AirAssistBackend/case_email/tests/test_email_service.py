from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from case_email.services.email_service import (
    send_basic_email,
    send_password_reset_email,
    send_user_created_email,
)


@override_settings(
    DEFAULT_FROM_EMAIL="noreply@airassist.com",
)
class EmailServiceTests(SimpleTestCase):

    @patch("case_email.services.email_service.EmailMessage")
    def test_send_basic_email(self, mock_email_class):
        mock_email = mock_email_class.return_value
        mock_email.send.return_value = 1

        result = send_basic_email(
            "john.doe@example.com",
            "Test Subject",
            "Test Body",
        )

        mock_email_class.assert_called_once_with(
            subject="Test Subject",
            body="Test Body",
            from_email="noreply@airassist.com",
            to=["john.doe@example.com"],
        )

        mock_email.send.assert_called_once_with()

        self.assertEqual(result, 1)

    @patch("case_email.services.email_service.send_template_email")
    def test_send_user_created_email(
        self,
        mock_send_template_email,
    ):
        user = Mock()
        user.id = 123
        user.role.id = 2
        user.firstname = "John"
        user.lastname = "Doe"
        user.email = "john.doe@example.com"

        plain_password = "Password123!"

        mock_send_template_email.return_value = 1

        result = send_user_created_email(
            user,
            plain_password,
        )

        mock_send_template_email.assert_called_once_with(
            to_email="john.doe@example.com",
            subject="Account Created",
            template_name="create_user.html",
            context={
                "user_id": 123,
                "role_id": 2,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "password": "Password123!",
            },
        )

        self.assertEqual(result, 1)

    @patch("case_email.services.email_service.send_template_email")
    def test_send_user_created_email_propagates_error(
        self,
        mock_send_template_email,
    ):
        user = Mock()
        user.id = 123
        user.role.id = 2
        user.firstname = "John"
        user.lastname = "Doe"
        user.email = "john.doe@example.com"

        mock_send_template_email.side_effect = Exception(
            "Email sending error"
        )

        with self.assertRaises(Exception) as context:
            send_user_created_email(
                user,
                "Password123!",
            )

        self.assertEqual(
            str(context.exception),
            "Email sending error",
        )

    @patch("case_email.services.email_service.send_template_email")
    def test_send_password_reset_email(
        self,
        mock_send_template_email,
    ):
        user = Mock()
        user.firstname = "John"
        user.email = "john.doe@example.com"

        reset_url = (
            "https://example.com/reset-password/abc123/"
        )

        mock_send_template_email.return_value = 1

        result = send_password_reset_email(
            user,
            reset_url,
        )

        mock_send_template_email.assert_called_once_with(
            to_email="john.doe@example.com",
            subject="Password Reset",
            template_name="password_reset.html",
            context={
                "first_name": "John",
                "reset_url": reset_url,
            },
        )

        self.assertEqual(result, 1)

    @patch("case_email.services.email_service.send_template_email")
    def test_send_password_reset_email_propagates_error(
        self,
        mock_send_template_email,
    ):
        user = Mock()
        user.firstname = "John"
        user.email = "john.doe@example.com"

        reset_url = (
            "https://example.com/reset-password/abc123/"
        )

        mock_send_template_email.side_effect = Exception(
            "Email sending error"
        )

        with self.assertRaises(Exception) as context:
            send_password_reset_email(
                user,
                reset_url,
            )

        self.assertEqual(
            str(context.exception),
            "Email sending error",
        )