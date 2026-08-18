from unittest.mock import patch

from rest_framework.test import APITestCase

from system_options.models import SystemOption
from user.enums.roles import Roles
from user.models.users import Role, User


class SystemOptionApiTests(APITestCase):
    def setUp(self):
        self.system_admin_role = Role.objects.create(role=Roles.SYSTEM_ADMIN.value)
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)

        self.admin = User.objects.create_user(
            role=self.system_admin_role,
            firstname="Admin",
            lastname="User",
            email="admin@example.com",
            password="admin-pass",
        )
        self.colleague = User.objects.create_user(
            role=self.colleague_role,
            firstname="Case",
            lastname="Worker",
            email="colleague@example.com",
            password="col-pass",
        )
        self.url = "/api/system-options/"

    def test_requires_system_admin(self):
        self.client.force_authenticate(user=self.colleague)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 403)

    def test_get_returns_default_settings_and_creates_records(self):
        self.client.force_authenticate(user=self.admin)

        self.assertEqual(SystemOption.objects.count(), 0)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("email_preset", response.data["data"])
        self.assertIn("pdf_preset", response.data["data"])
        self.assertEqual(SystemOption.objects.count(), 2)

    def test_patch_persists_email_and_pdf_presets(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "email_preset": {
                "delivery_mode": "SMTP",
                "sender_name": "Operations Desk",
                "sender_email": "ops@airassist.eu",
                "reply_to_email": "helpdesk@airassist.eu",
                "smtp_host": "smtp.office365.com",
                "smtp_port": 2525,
                "smtp_username": "ops@airassist.eu",
                "use_tls": True,
                "subject_template": "Case {{case_number}} is ready",
                "body_template": "Hello {{passenger_name}}, case {{case_number}} has been updated.",
                "footer_text": "Handled by the operations desk.",
            },
            "pdf_preset": {
                "layout": "DETAILED",
                "page_size": "LETTER",
                "include_branding": True,
                "include_disruption_summary": True,
                "include_passenger_contact": False,
                "include_case_timeline": True,
                "exported_fields": [
                    "case_number",
                    "passenger_name",
                    "claim_status",
                ],
                "footer_text": "Prepared for review.",
            },
        }

        response = self.client.patch(self.url, payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "System options saved successfully.")
        self.assertEqual(SystemOption.objects.count(), 2)

        email_option = SystemOption.objects.get(option_type="EMAIL_PRESET")
        pdf_option = SystemOption.objects.get(option_type="PDF_PRESET")

        self.assertEqual(email_option.configuration["sender_name"], "Operations Desk")
        self.assertEqual(email_option.configuration["smtp_host"], "smtp.office365.com")
        self.assertEqual(email_option.configuration["delivery_mode"], "SMTP")
        self.assertEqual(email_option.updated_by_id, self.admin.id)
        self.assertEqual(pdf_option.configuration["layout"], "DETAILED")
        self.assertEqual(
            pdf_option.configuration["exported_fields"],
            ["case_number", "passenger_name", "claim_status"],
        )

    def test_patch_persists_microsoft_graph_delivery_mode(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "email_preset": {
                "delivery_mode": "MICROSOFT_GRAPH",
                "sender_name": "Operations Desk",
                "sender_email": "ops@airassist.eu",
                "reply_to_email": "helpdesk@airassist.eu",
                "smtp_host": "smtp.office365.com",
                "smtp_port": 2525,
                "smtp_username": "ops@airassist.eu",
                "use_tls": True,
                "subject_template": "Case {{case_number}} is ready",
                "body_template": "Hello {{passenger_name}}, case {{case_number}} has been updated.",
                "footer_text": "Handled by the operations desk.",
            },
            "pdf_preset": {
                "layout": "STANDARD",
                "page_size": "A4",
                "include_branding": True,
                "include_disruption_summary": True,
                "include_passenger_contact": True,
                "include_case_timeline": True,
                "exported_fields": ["case_number"],
                "footer_text": "Prepared for review.",
            },
        }

        patch_response = self.client.patch(self.url, payload, format="json")
        get_response = self.client.get(self.url)

        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(
            get_response.data["data"]["email_preset"]["delivery_mode"],
            "MICROSOFT_GRAPH",
        )

    def test_patch_rejects_unsupported_placeholders(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "email_preset": {
                "delivery_mode": "SMTP",
                "sender_name": "Operations Desk",
                "sender_email": "ops@airassist.eu",
                "reply_to_email": "helpdesk@airassist.eu",
                "smtp_host": "smtp.office365.com",
                "smtp_port": 2525,
                "smtp_username": "ops@airassist.eu",
                "use_tls": True,
                "subject_template": "Case {{unknown_token}}",
                "body_template": "Hello {{passenger_name}}",
                "footer_text": "Handled by the operations desk.",
            },
            "pdf_preset": {
                "layout": "STANDARD",
                "page_size": "A4",
                "include_branding": True,
                "include_disruption_summary": True,
                "include_passenger_contact": True,
                "include_case_timeline": True,
                "exported_fields": ["case_number"],
                "footer_text": "Prepared for review.",
            },
        }

        response = self.client.patch(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email_preset", response.data)
        self.assertEqual(SystemOption.objects.count(), 0)

    @patch.dict(
        "os.environ",
        {"EMAIL_HOST_USER": "real.sender@gmail.com"},
        clear=False,
    )
    def test_get_replaces_placeholder_email_fields_with_real_env_mailbox(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["data"]["email_preset"]["sender_email"],
            "real.sender@gmail.com",
        )
        self.assertEqual(
            response.data["data"]["email_preset"]["reply_to_email"],
            "real.sender@gmail.com",
        )
        self.assertEqual(
            response.data["data"]["email_preset"]["smtp_username"],
            "real.sender@gmail.com",
        )
