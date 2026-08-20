from datetime import datetime, timedelta
from unittest.mock import patch

from django.contrib.auth.hashers import check_password
from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient

from user.enums.roles import Roles
from user.models.users import Role, User


class PasswordResetViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(role=Roles.PASSENGER.value)
        self.user = User.objects.create_user(
            role=self.role,
            firstname="Ada",
            lastname="Lovelace",
            email="ada@example.com",
            password="old-password-123",
        )
        self.user.must_change_password = True
        self.user.save(update_fields=["must_change_password"])

    @patch("user.service.user_service.send_password_reset_email")
    def test_request_password_reset_sends_email_for_existing_user(self, mock_send_email):
        response = self.client.post(
            "/user/request-password-reset/",
            data={"email": "ada@example.com"},
            format="json",
            HTTP_ORIGIN="http://localhost:5173",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("password reset link", response.data["message"].lower())
        mock_send_email.assert_called_once()

        _, reset_url = mock_send_email.call_args.args
        self.assertIn("http://localhost:5173/reset-password?uid=", reset_url)
        self.assertIn("&token=", reset_url)

    @patch("user.service.user_service.send_password_reset_email")
    def test_request_password_reset_returns_not_found_for_unknown_email(self, mock_send_email):
        response = self.client.post(
            "/user/request-password-reset/",
            data={"email": "missing@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("no account", response.data["message"].lower())
        mock_send_email.assert_not_called()

    def test_reset_password_with_valid_token_updates_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            "/user/reset-password/",
            data={
                "uid": uid,
                "token": token,
                "new_password": "new-password-456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(check_password("new-password-456", self.user.password))
        self.assertFalse(self.user.must_change_password)

    def test_reset_password_rejects_same_as_current_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            "/user/reset-password/",
            data={
                "uid": uid,
                "token": token,
                "new_password": "old-password-123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["message"],
            "New password cannot be the same as the current password.",
        )
        self.user.refresh_from_db()
        self.assertTrue(check_password("old-password-123", self.user.password))
        self.assertTrue(self.user.must_change_password)

    def test_reset_password_rejects_invalid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        response = self.client.post(
            "/user/reset-password/",
            data={
                "uid": uid,
                "token": "invalid-token",
                "new_password": "new-password-456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Invalid or expired password reset link.")

    @override_settings(PASSWORD_RESET_TIMEOUT=60 * 10)
    def test_reset_password_rejects_expired_token_after_ten_minutes(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        issued_at = datetime(2026, 1, 1, 12, 0, 0)

        with patch.object(default_token_generator, "_now", return_value=issued_at):
            token = default_token_generator.make_token(self.user)

        response = None
        with patch.object(
            default_token_generator,
            "_now",
            return_value=issued_at + timedelta(minutes=11),
        ):
            response = self.client.post(
                "/user/reset-password/",
                data={
                    "uid": uid,
                    "token": token,
                    "new_password": "new-password-456",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Invalid or expired password reset link.")