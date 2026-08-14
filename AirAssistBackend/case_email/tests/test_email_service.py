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

    @patch("case_email.services.email_service.send_basic_email")
    def test_send_user_created_email(
        self,
        mock_send_basic_email,
    ):
        user = Mock()
        user.id = 123
        user.role.id = 2
        user.firstname = "John"
        user.lastname = "Doe"
        user.email = "john.doe@example.com"

        plain_password = "Password123!"

        mock_send_basic_email.return_value = 1

        result = send_user_created_email(
            user,
            plain_password,
        )

        mock_send_basic_email.assert_called_once()

        call_kwargs = mock_send_basic_email.call_args.kwargs

        self.assertEqual(
            call_kwargs["to_email"],
            "john.doe@example.com",
        )

        self.assertEqual(
            call_kwargs["subject"],
            "Account Created",
        )

        body = call_kwargs["body"]

        self.assertIn("Hello John", body)
        self.assertIn("User ID: 123", body)
        self.assertIn("Role ID: 2", body)
        self.assertIn("First Name: John", body)
        self.assertIn("Last Name: Doe", body)
        self.assertIn("Email: john.doe@example.com", body)
        self.assertIn("Password: Password123!", body)
        self.assertIn("AirAssist Team", body)

        self.assertEqual(result, 1)

    @patch("case_email.services.email_service.send_basic_email")
    def test_send_user_created_email_propagates_error(
        self,
        mock_send_basic_email,
    ):
        user = Mock()
        user.id = 123
        user.role.id = 2
        user.firstname = "John"
        user.lastname = "Doe"
        user.email = "john.doe@example.com"

        mock_send_basic_email.side_effect = Exception(
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

    @patch("case_email.services.email_service.send_basic_email")
    def test_send_password_reset_email(
        self,
        mock_send_basic_email,
    ):
        user = Mock()
        user.firstname = "John"
        user.email = "john.doe@example.com"

        reset_url = (
            "https://example.com/reset-password/abc123/"
        )

        mock_send_basic_email.return_value = 1

        result = send_password_reset_email(
            user,
            reset_url,
        )

        mock_send_basic_email.assert_called_once()

        call_kwargs = mock_send_basic_email.call_args.kwargs

        self.assertEqual(
            call_kwargs["to_email"],
            "john.doe@example.com",
        )

        self.assertEqual(
            call_kwargs["subject"],
            "Password Reset",
        )

        body = call_kwargs["body"]

        self.assertIn("Hello John", body)
        self.assertIn(
            "We received a request to reset your AirAssist password.",
            body,
        )
        self.assertIn(reset_url, body)
        self.assertIn(
            "If you did not request this change, you can ignore this email.",
            body,
        )
        self.assertIn("AirAssist Team", body)

        self.assertEqual(result, 1)

    @patch("case_email.services.email_service.send_basic_email")
    def test_send_password_reset_email_propagates_error(
        self,
        mock_send_basic_email,
    ):
        user = Mock()
        user.firstname = "John"
        user.email = "john.doe@example.com"

        reset_url = (
            "https://example.com/reset-password/abc123/"
        )

        mock_send_basic_email.side_effect = Exception(
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