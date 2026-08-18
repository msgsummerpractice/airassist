from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.conversation_status_enum import ConversationStatus
from case.models.case import Case
from case.models.comment import Comment
from case.models.passengers import Passenger
from user.models.users import Role, User


class CaseConversationApiTests(APITestCase):
    def setUp(self):
        passenger_role = Role.objects.create(role="PASSENGER")
        colleague_role = Role.objects.create(role="COLLEAGUE")

        self.passenger = User.objects.create_user(
            role=passenger_role,
            email="passenger@example.com",
            password="testpass123",
            firstname="Test",
            lastname="Passenger",
        )
        self.assigned_colleague = User.objects.create_user(
            role=colleague_role,
            email="assigned@example.com",
            password="testpass123",
            firstname="Assigned",
            lastname="Colleague",
        )
        self.other_colleague = User.objects.create_user(
            role=colleague_role,
            email="other@example.com",
            password="testpass123",
            firstname="Other",
            lastname="Colleague",
        )
        self.case = Case.objects.create(
            assigned_colleague=self.assigned_colleague,
            gdpr_consent=True,
        )
        Passenger.objects.create(
            case=self.case,
            first_name="Test",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email=self.passenger.email,
        )

        self.close_url = reverse(
            "colleague-case-conversation-close",
            kwargs={"case_id": self.case.id},
        )
        self.reopen_url = reverse(
            "colleague-case-conversation-reopen",
            kwargs={"case_id": self.case.id},
        )
        self.passenger_comment_url = reverse(
            "passenger-case-comment-create",
            kwargs={"pk": self.case.id},
        )
        self.colleague_comment_url = reverse(
            "colleague-case-comment-create",
            kwargs={"pk": self.case.id},
        )

    def test_assigned_colleague_can_close_conversation(self):
        self.client.force_authenticate(user=self.assigned_colleague)

        response = self.client.post(self.close_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.case.refresh_from_db()
        self.assertEqual(
            self.case.conversation_status,
            ConversationStatus.CLOSED.value,
        )
        self.assertIsNotNone(self.case.conversation_closed_at)
        self.assertEqual(
            self.case.conversation_closed_by_id,
            self.assigned_colleague.id,
        )
        self.assertEqual(
            response.data["conversation_status"],
            ConversationStatus.CLOSED.value,
        )

    def test_assigned_colleague_can_reopen_conversation(self):
        self.client.force_authenticate(user=self.assigned_colleague)
        self.client.post(self.close_url)

        response = self.client.post(self.reopen_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.case.refresh_from_db()
        self.assertEqual(
            self.case.conversation_status,
            ConversationStatus.OPEN.value,
        )
        self.assertIsNone(self.case.conversation_closed_at)
        self.assertIsNone(self.case.conversation_closed_by_id)

    def test_passenger_cannot_close_conversation(self):
        self.client.force_authenticate(user=self.passenger)

        response = self.client.post(self.close_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.case.refresh_from_db()
        self.assertEqual(
            self.case.conversation_status,
            ConversationStatus.OPEN.value,
        )

    def test_other_colleague_cannot_manage_conversation(self):
        self.client.force_authenticate(user=self.other_colleague)

        close_response = self.client.post(self.close_url)
        reopen_response = self.client.post(self.reopen_url)

        self.assertEqual(close_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(reopen_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_repeated_close_and_reopen_are_rejected(self):
        self.client.force_authenticate(user=self.assigned_colleague)

        first_close = self.client.post(self.close_url)
        second_close = self.client.post(self.close_url)
        first_reopen = self.client.post(self.reopen_url)
        second_reopen = self.client.post(self.reopen_url)

        self.assertEqual(first_close.status_code, status.HTTP_200_OK)
        self.assertEqual(second_close.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(first_reopen.status_code, status.HTTP_200_OK)
        self.assertEqual(second_reopen.status_code, status.HTTP_400_BAD_REQUEST)

    def test_comments_are_blocked_when_conversation_is_closed(self):
        self.client.force_authenticate(user=self.assigned_colleague)
        self.client.post(self.close_url)

        self.client.force_authenticate(user=self.passenger)
        passenger_response = self.client.post(
            self.passenger_comment_url,
            {"text": "Passenger comment"},
            format="json",
        )

        self.client.force_authenticate(user=self.assigned_colleague)
        colleague_response = self.client.post(
            self.colleague_comment_url,
            {"text": "Colleague comment"},
            format="json",
        )

        self.assertEqual(passenger_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(colleague_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Comment.objects.filter(case=self.case).count(), 0)

    def test_comments_work_after_reopening_conversation(self):
        self.client.force_authenticate(user=self.assigned_colleague)
        self.client.post(self.close_url)
        self.client.post(self.reopen_url)

        self.client.force_authenticate(user=self.passenger)
        passenger_response = self.client.post(
            self.passenger_comment_url,
            {"text": "Passenger comment"},
            format="json",
        )

        self.client.force_authenticate(user=self.assigned_colleague)
        colleague_response = self.client.post(
            self.colleague_comment_url,
            {"text": "Colleague comment"},
            format="json",
        )

        self.assertEqual(passenger_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(colleague_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.filter(case=self.case).count(), 2)
