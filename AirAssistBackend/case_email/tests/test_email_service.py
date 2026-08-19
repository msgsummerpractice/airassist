from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase, override_settings

from case_email.services.email_service import (
    send_basic_email,
    send_case_status_update_email,
    send_password_reset_email,
    send_template_email,
    send_user_created_email,
)


@override_settings(
    DEFAULT_FROM_EMAIL="noreply@airassist.com",
)
class EmailServiceTests(SimpleTestCase):

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend")
    @patch("case_email.services.email_service.EmailMessage")
    @patch("case_email.services.email_service.get_connection")
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_basic_email(self, mock_get_email_preset, mock_get_connection, mock_email_class):
        mock_email = mock_email_class.return_value
        mock_email.send.return_value = 1
        mock_connection = Mock()
        mock_get_connection.return_value = mock_connection
        mock_get_email_preset.return_value = {
            "delivery_mode": "SMTP",
            "sender_name": "Operations Desk",
            "sender_email": "ops@airassist.eu",
            "reply_to_email": "reply@airassist.eu",
            "smtp_host": "smtp.office365.com",
            "smtp_port": 2525,
            "smtp_username": "ops@airassist.eu",
            "use_tls": True,
            "footer_text": "Handled by AirAssist.",
        }

        result = send_basic_email(
            "john.doe@example.com",
            "Test Subject",
            "Test Body",
        )

        mock_email_class.assert_called_once_with(
            subject="Test Subject",
            body="Test Body",
            from_email="Operations Desk <ops@airassist.eu>",
            to=["john.doe@example.com"],
            reply_to=["reply@airassist.eu"],
            connection=mock_connection,
        )
        mock_get_connection.assert_called_once()
        mock_email.send.assert_called_once_with()
        self.assertEqual(result, 1)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend")
    @patch("case_email.services.email_service.EmailMessage")
    @patch("case_email.services.email_service.get_connection")
    @patch("case_email.services.email_service.render_to_string")
    @patch("case_email.services.email_service._load_logo_attachment")
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_template_email_applies_email_preset_to_message_and_context(
        self,
        mock_get_email_preset,
        mock_load_logo_attachment,
        mock_render_to_string,
        mock_get_connection,
        mock_email_class,
    ):
        mock_get_email_preset.return_value = {
            "delivery_mode": "SMTP",
            "sender_name": "Operations Desk",
            "sender_email": "ops@airassist.eu",
            "reply_to_email": "reply@airassist.eu",
            "smtp_host": "smtp.office365.com",
            "smtp_port": 2525,
            "smtp_username": "ops@airassist.eu",
            "use_tls": True,
            "footer_text": "Handled by AirAssist.",
        }
        mock_load_logo_attachment.return_value = {
            "filename": "logo.png",
            "content": b"image-bytes",
            "mimetype": "image/png",
            "content_id": "logo",
            "disposition": "inline",
        }
        mock_render_to_string.return_value = "<p>Hello</p>"
        mock_email = mock_email_class.return_value
        mock_email.send.return_value = 1
        mock_connection = Mock()
        mock_get_connection.return_value = mock_connection

        result = send_template_email(
            to_email="john.doe@example.com",
            subject="Case Update",
            template_name="case_status_update.html",
            context={"first_name": "John"},
        )

        mock_render_to_string.assert_called_once_with(
            "case_status_update.html",
            {
                "first_name": "John",
                "sender_name": "Operations Desk",
                "organisation_name": "Operations Desk",
                "footer_text": "Handled by AirAssist.",
                "support_email": "ops@airassist.eu",
                "reply_to_email": "reply@airassist.eu",
            },
        )
        mock_email_class.assert_called_once_with(
            subject="Case Update",
            body="<p>Hello</p>",
            from_email="Operations Desk <ops@airassist.eu>",
            to=["john.doe@example.com"],
            reply_to=["reply@airassist.eu"],
            connection=mock_connection,
        )
        self.assertEqual(mock_email.content_subtype, "html")
        mock_email.attach.assert_called_once()
        self.assertEqual(result, 1)

    @patch("case_email.services.email_service.requests.post")
    @patch.dict("os.environ", {"SENDGRID_API_KEY": "sendgrid-key"}, clear=False)
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_basic_email_uses_sendgrid_when_selected(
        self,
        mock_get_email_preset,
        mock_requests_post,
    ):
        mock_get_email_preset.return_value = {
            "delivery_mode": "SENDGRID_API",
            "sender_name": "Operations Desk",
            "sender_email": "ops@airassist.eu",
            "reply_to_email": "reply@airassist.eu",
        }
        mock_requests_post.return_value.status_code = 202
        mock_requests_post.return_value.text = ""

        result = send_basic_email(
            "john.doe@example.com",
            "Test Subject",
            "Test Body",
        )

        self.assertEqual(result, 1)
        self.assertEqual(mock_requests_post.call_count, 1)
        self.assertEqual(
            mock_requests_post.call_args.kwargs["json"]["from"]["email"],
            "ops@airassist.eu",
        )
        self.assertEqual(
            mock_requests_post.call_args.kwargs["json"]["content"][0]["type"],
            "text/plain",
        )

    @patch("case_email.services.email_service._send_via_smtp")
    @patch("case_email.services.email_service._send_via_sendgrid")
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_basic_email_falls_back_to_smtp_when_sendgrid_fails(
        self,
        mock_get_email_preset,
        mock_send_via_sendgrid,
        mock_send_via_smtp,
    ):
        mock_get_email_preset.return_value = {
            "delivery_mode": "SENDGRID_API",
            "sender_name": "Operations Desk",
            "sender_email": "ops@airassist.eu",
            "reply_to_email": "reply@airassist.eu",
        }
        mock_send_via_sendgrid.side_effect = ValueError(
            "SendGrid API key is not configured.",
        )
        mock_send_via_smtp.return_value = 1

        result = send_basic_email(
            "john.doe@example.com",
            "Test Subject",
            "Test Body",
        )

        self.assertEqual(result, 1)
        mock_send_via_sendgrid.assert_called_once()
        mock_send_via_smtp.assert_called_once()

    @patch("case_email.services.email_service.requests.post")
    @patch.dict(
        "os.environ",
        {
            "MICROSOFT_GRAPH_TENANT_ID": "tenant-id",
            "MICROSOFT_GRAPH_CLIENT_ID": "client-id",
            "MICROSOFT_GRAPH_CLIENT_SECRET": "client-secret",
        },
        clear=False,
    )
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_template_email_uses_microsoft_graph_when_selected(
        self,
        mock_get_email_preset,
        mock_requests_post,
    ):
        mock_get_email_preset.return_value = {
            "delivery_mode": "MICROSOFT_GRAPH",
            "sender_name": "Operations Desk",
            "sender_email": "ops@airassist.eu",
            "reply_to_email": "reply@airassist.eu",
            "footer_text": "Handled by AirAssist.",
        }
        token_response = Mock(status_code=200)
        token_response.json.return_value = {"access_token": "graph-token"}
        send_response = Mock(status_code=202, text="")
        mock_requests_post.side_effect = [token_response, send_response]

        with patch(
            "case_email.services.email_service.render_to_string",
            return_value="<p>Hello</p>",
        ), patch(
            "case_email.services.email_service._load_logo_attachment",
            return_value={
                "filename": "logo.png",
                "content": b"image-bytes",
                "mimetype": "image/png",
                "content_id": "logo",
                "disposition": "inline",
            },
        ):
            result = send_template_email(
                to_email="john.doe@example.com",
                subject="Case Update",
                template_name="case_status_update.html",
                context={"first_name": "John"},
            )

        self.assertEqual(result, 1)
        self.assertEqual(mock_requests_post.call_count, 2)
        self.assertIn(
            "oauth2/v2.0/token",
            mock_requests_post.call_args_list[0].args[0],
        )
        self.assertIn(
            "/users/ops@airassist.eu/sendMail",
            mock_requests_post.call_args_list[1].args[0],
        )
        self.assertEqual(
            mock_requests_post.call_args_list[1].kwargs["json"]["message"]["body"]["contentType"],
            "HTML",
        )

    @patch("case_email.services.email_service._send_via_smtp")
    @patch("case_email.services.email_service._send_via_microsoft_graph")
    @patch("case_email.services.email_service._load_logo_attachment")
    @patch("case_email.services.email_service.render_to_string")
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_template_email_falls_back_to_smtp_when_graph_fails(
        self,
        mock_get_email_preset,
        mock_render_to_string,
        mock_load_logo_attachment,
        mock_send_via_microsoft_graph,
        mock_send_via_smtp,
    ):
        mock_get_email_preset.return_value = {
            "delivery_mode": "MICROSOFT_GRAPH",
            "sender_name": "Operations Desk",
            "sender_email": "ops@airassist.eu",
            "reply_to_email": "reply@airassist.eu",
            "footer_text": "Handled by AirAssist.",
        }
        mock_render_to_string.return_value = "<p>Hello</p>"
        mock_load_logo_attachment.return_value = {
            "filename": "logo.png",
            "content": b"image-bytes",
            "mimetype": "image/png",
            "content_id": "logo",
            "disposition": "inline",
        }
        mock_send_via_microsoft_graph.side_effect = ValueError(
            "Microsoft Graph credentials are not configured.",
        )
        mock_send_via_smtp.return_value = 1

        result = send_template_email(
            to_email="john.doe@example.com",
            subject="Case Update",
            template_name="case_status_update.html",
            context={"first_name": "John"},
        )

        self.assertEqual(result, 1)
        mock_send_via_microsoft_graph.assert_called_once()
        mock_send_via_smtp.assert_called_once()

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
    @patch("case_email.services.email_service.Case")
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_case_status_update_email_uses_preset_subject_and_message(
        self,
        mock_get_email_preset,
        mock_case_model,
        mock_send_template_email,
    ):
        passenger = Mock()
        passenger.first_name = "John"
        passenger.last_name = "Doe"
        passenger.email = "john.doe@example.com"
        mock_case_model.objects.prefetch_related.return_value.filter.return_value.first.return_value = None
        mock_get_email_preset.return_value = {
            "sender_name": "Operations Desk",
            "subject_template": "Case {{case_number}} is ready",
            "body_template": "Hello {{passenger_name}} from {{organisation_name}}",
        }
        mock_send_template_email.return_value = 1

        result = send_case_status_update_email(
            passenger=passenger,
            case_id=42,
            case_status="ELIGIBLE",
            note="Bring ID.",
        )

        mock_send_template_email.assert_called_once_with(
            to_email="john.doe@example.com",
            subject="Case 42 is ready",
            template_name="case_status_update.html",
            context={
                "first_name": "John",
                "case_id": 42,
                "case_status": "Eligible",
                "note": "Bring ID.",
                "preset_message": "Hello John Doe from Operations Desk",
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
            "Email sending error",
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

        reset_url = "https://example.com/reset-password/abc123/"

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

        reset_url = "https://example.com/reset-password/abc123/"

        mock_send_template_email.side_effect = Exception(
            "Email sending error",
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


@override_settings(
    DEFAULT_FROM_EMAIL="noreply@airassist.com",
)
class CaseStatusEmailServiceTests(TestCase):

    @patch("case_email.services.email_service.send_template_email")
    @patch("case_email.services.email_service.SystemOptionService.get_email_preset")
    def test_send_case_status_update_email_includes_main_flight_number_in_preset_message(
        self,
        mock_get_email_preset,
        mock_send_template_email,
    ):
        from case.models import Case, Flight
        from case.models.passengers import Passenger

        case = Case.objects.create(status="PENDING")
        passenger = Passenger.objects.create(
            case=case,
            first_name="John",
            last_name="Doe",
            date_of_birth="1990-01-01",
            email="john.doe@example.com",
        )
        Flight.objects.create(
            case=case,
            flight_date="2026-08-19",
            flight_number="RO123",
            airline="Tarom",
            reservation_number="ABC123",
            departing_airport="OTP",
            destination_airport="MAD",
            planned_departure_time="09:00",
            planned_arrival_time="12:00",
            is_main_flight=True,
        )

        mock_get_email_preset.return_value = {
            "sender_name": "Operations Desk",
            "subject_template": "Case {{case_number}} is ready",
            "body_template": "Hello {{passenger_name}} for flight {{flight_number}} from {{organisation_name}}",
        }
        mock_send_template_email.return_value = 1

        result = send_case_status_update_email(
            passenger=passenger,
            case_id=case.id,
            case_status="ELIGIBLE",
            note="Bring ID.",
        )

        mock_send_template_email.assert_called_once_with(
            to_email="john.doe@example.com",
            subject=f"Case {case.id} is ready",
            template_name="case_status_update.html",
            context={
                "first_name": "John",
                "case_id": case.id,
                "case_status": "Eligible",
                "note": "Bring ID.",
                "preset_message": "Hello John Doe for flight RO123 from Operations Desk",
            },
        )
        self.assertEqual(result, 1)
