from datetime import datetime
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from case.services.case_contract_service import CaseContractGenerationError
from user.enums.roles import Roles
from user.models.users import Role, User


class ColleagueCaseCreationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.role = Role.objects.create(role=Roles.COLLEAGUE.value)

        self.user = User.objects.create_user(
            role=self.role,
            firstname="Ada",
            lastname="Lovelace",
            email="ada@example.com",
            password="password-123",
        )

        self.url = reverse("colleague-case-create")

    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationService.build_dashboard_payload"
    )
    def test_get_returns_dashboard_payload(self, mock_build_dashboard):
        mock_build_dashboard.return_value = {
            "total_cases": 5,
            "pending_cases": 2,
        }

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(
            response.data["data"],
            {
                "total_cases": 5,
                "pending_cases": 2,
            },
        )

        mock_build_dashboard.assert_called_once_with(self.user)

    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationSerializer"
    )
    def test_post_returns_400_for_invalid_data(self, mock_serializer_class):
        serializer = mock_serializer_class.return_value
        serializer.is_valid.return_value = False
        serializer.errors = {
            "passengers": ["This field is required."]
        }

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            data={},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["errors"],
            {
                "passengers": ["This field is required."]
            },
        )

        serializer.is_valid.assert_called_once()
        serializer.save.assert_not_called()

    @patch(
        "colleague_cases.views.colleague_case_creation_view.CaseContractService.generate_for_case"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.CaseService.create_passenger_account"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.CaseService.calculate_case_compensation"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationService.link_colleague_to_case"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationSerializer"
    )
    def test_post_creates_case_successfully(
        self,
        mock_serializer_class,
        mock_link_colleague,
        mock_calculate_compensation,
        mock_create_passenger_account,
        mock_generate_contract,
    ):
        case = mock_serializer_class.return_value.save.return_value

        case.id = 123
        case.status = "PENDING"
        case.created_at = datetime(2026, 8, 14, 10, 30)

        passenger = case.passengers.first.return_value

        contract_document = mock_generate_contract.return_value
        contract_document.id = 456

        mock_serializer_class.return_value.is_valid.return_value = True

        mock_link_colleague.return_value = case

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            data={
                "firstname": "John",
                "lastname": "Doe",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(
            response.data["message"],
            "Case created successfully. Your contract PDF is ready for download.",
        )

        self.assertEqual(response.data["data"]["case_id"], 123)
        self.assertEqual(response.data["data"]["status"], "PENDING")
        self.assertEqual(
            response.data["data"]["created_at"],
            case.created_at,
        )
        self.assertEqual(
            response.data["data"]["contract_document_id"],
            456,
        )
        self.assertTrue(
            response.data["data"]["contract_download_url"].endswith("/api/cases/123/contract/")
        )

        mock_serializer_class.return_value.is_valid.assert_called_once()
        mock_serializer_class.return_value.save.assert_called_once()

        mock_link_colleague.assert_called_once_with(
            case,
            self.user,
        )
        mock_calculate_compensation.assert_called_once_with(case)
        mock_create_passenger_account.assert_called_once_with(passenger)
        mock_generate_contract.assert_called_once_with(case)

    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationService.link_colleague_to_case"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationSerializer"
    )
    def test_post_returns_500_for_database_error(
        self,
        mock_serializer_class,
        mock_link_colleague,
    ):
        case = mock_serializer_class.return_value.save.return_value
        mock_serializer_class.return_value.is_valid.return_value = True

        from psycopg2 import DatabaseError

        mock_link_colleague.side_effect = DatabaseError(
            "Database connection failed"
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            data={
                "firstname": "John",
                "lastname": "Doe",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["message"],
            "Failed to save case. Please try again.",
        )

    @patch(
        "colleague_cases.views.colleague_case_creation_view.CaseContractService.generate_for_case"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.CaseService.create_passenger_account"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.CaseService.calculate_case_compensation"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationService.link_colleague_to_case"
    )
    @patch(
        "colleague_cases.views.colleague_case_creation_view.ColleagueCaseCreationSerializer"
    )
    def test_post_returns_500_for_contract_generation_error(
        self,
        mock_serializer_class,
        mock_link_colleague,
        mock_calculate_compensation,
        mock_create_passenger_account,
        mock_generate_contract,
    ):
        case = mock_serializer_class.return_value.save.return_value
        mock_serializer_class.return_value.is_valid.return_value = True

        mock_link_colleague.return_value = case
        mock_generate_contract.side_effect = CaseContractGenerationError(
            "Could not generate PDF"
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            data={
                "firstname": "John",
                "lastname": "Doe",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["message"],
            "Failed to save case. Please try again.",
        )