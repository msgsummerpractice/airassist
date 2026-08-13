from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.models.case import Case
from case.models.comment import Comment
from case.models.passengers import Passenger
from user.models.users import Role, User


class PassengerCaseCommentApiTests(APITestCase):
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
        self.other_passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="bob@example.com",
            password="testpass123",
            firstname="Bob",
            lastname="Passenger",
        )
        self.colleague_user = User.objects.create_user(
            role=self.colleague_role,
            email="agent@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Agent",
        )

        self.owned_case = Case.objects.create(
            status=CaseState.ASSIGNED.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.owned_case,
            first_name="Alice",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email="alice@example.com",
        )

        self.other_case = Case.objects.create(
            status=CaseState.NEW.value,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.other_case,
            first_name="Bob",
            last_name="Passenger",
            date_of_birth="1991-01-01",
            email="bob@example.com",
        )

        self.url = f"/api/cases/me/{self.owned_case.id}/comments/"

    def test_requires_authentication(self):
        response = self.client.post(self.url, {"text": "Hello"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbids_non_passenger_users(self):
        self.client.force_authenticate(user=self.colleague_user)

        response = self.client.post(self.url, {"text": "Hello"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_not_found_for_unowned_case(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(
            f"/api/cases/me/{self.other_case.id}/comments/",
            {"text": "I should not post here"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_creates_comment_for_owned_case(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(
            self.url,
            {"text": "Need to add more details about my flight."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.filter(case=self.owned_case).count(), 1)

        comment = Comment.objects.get(case=self.owned_case)
        self.assertEqual(comment.author_id, self.passenger_user.id)
        self.assertEqual(
            comment.text,
            "Need to add more details about my flight.",
        )

        self.assertEqual(response.data["text"], comment.text)
        self.assertEqual(response.data["author_email"], self.passenger_user.email)
        self.assertEqual(response.data["author_role"], "PASSENGER")
        self.assertIsNotNone(response.data["created_at"])

    def test_rejects_empty_text_comment(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(self.url, {"text": "   "}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", response.data)

    def test_rejects_comment_longer_than_1000_characters(self):
        self.client.force_authenticate(user=self.passenger_user)

        response = self.client.post(self.url, {"text": "a" * 1001}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", response.data)