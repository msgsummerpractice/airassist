from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.models.case import Case
from case.models.comment import Comment
from user.models.users import Role, User


class ColleagueCaseCommentApiTests(APITestCase):
    def setUp(self):
        self.passenger_role = Role.objects.create(role="PASSENGER")
        self.colleague_role = Role.objects.create(role="COLLEAGUE")

        self.passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="alice@example.com",
            password="testpass123",
            firstname="Alice",
            lastname="Passenger",
        )
        self.colleague_user = User.objects.create_user(
            role=self.colleague_role,
            email="agent@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Agent",
        )

        self.case = Case.objects.create(
            status=CaseState.ASSIGNED.value,
            gdpr_consent=True,
        )
        self.url = f"/api/cases/colleague/{self.case.id}/comments/"

    def test_requires_authentication(self):
        response = self.client.post(self.url, {"text": "Hello"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbids_non_colleague_users(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(self.url, {"text": "Hello"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creates_comment_for_existing_case(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(
            self.url,
            {"text": "Passenger document has been reviewed."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.filter(case=self.case).count(), 1)

        comment = Comment.objects.get(case=self.case)
        self.assertEqual(comment.author_id, self.colleague_user.id)
        self.assertEqual(comment.text, "Passenger document has been reviewed.")

        self.assertEqual(response.data["text"], comment.text)
        self.assertEqual(response.data["author_email"], self.colleague_user.email)
        self.assertEqual(response.data["author_role"], "COLLEAGUE")
        self.assertIsNotNone(response.data["created_at"])

    def test_returns_not_found_for_missing_case(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(
            "/api/cases/colleague/999999/comments/",
            {"text": "Missing case."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rejects_empty_text_comment(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(self.url, {"text": "   "}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", response.data)

    def test_rejects_comment_longer_than_1000_characters(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(self.url, {"text": "a" * 1001}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", response.data)