from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from user.enums.roles import Roles
from user.models.users import Role, User


class ColleagueCaseListViewTests(TestCase):
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

        self.url = reverse("colleague-case-list")

    @patch(
        "colleague_cases.views.colleague_case_list_view.ColleagueCaseListSerializer"
    )
    @patch(
        "colleague_cases.views.colleague_case_list_view.ColleagueCaseListService.get_cases"
    )
    def test_get_returns_cases(
        self,
        mock_get_cases,
        mock_serializer_class,
    ):
        cases = ["case-1", "case-2"]

        serialized_cases = [
            {
                "id": 1,
                "status": "PENDING",
            },
            {
                "id": 2,
                "status": "IN_PROGRESS",
            },
        ]

        mock_get_cases.return_value = cases
        mock_serializer_class.return_value.data = serialized_cases

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(
            response.data["data"],
            serialized_cases,
        )

        mock_get_cases.assert_called_once_with()
        mock_serializer_class.assert_called_once_with(
            cases,
            many=True,
        )

    @patch(
        "colleague_cases.views.colleague_case_list_view.ColleagueCaseListSerializer"
    )
    @patch(
        "colleague_cases.views.colleague_case_list_view.ColleagueCaseListService.get_cases"
    )
    def test_get_returns_empty_list(
        self,
        mock_get_cases,
        mock_serializer_class,
    ):
        mock_get_cases.return_value = []
        mock_serializer_class.return_value.data = []

        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"], [])

        mock_get_cases.assert_called_once_with()
        mock_serializer_class.assert_called_once_with(
            [],
            many=True,
        )