from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from case.enums.case_state_enum import CaseState
from case.models.case import Case
from case.models.passengers import Passenger
from user.enums.roles import Roles
from user.models.users import Role, User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class CaseStatusUpdateApiTests(APITestCase):
    def setUp(self):
        self.passenger_role = Role.objects.create(role=Roles.PASSENGER.value)
        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)

        self.passenger_user = User.objects.create_user(
            role=self.passenger_role,
            email="passenger-account@example.com",
            password="testpass123",
            firstname="Pat",
            lastname="Passenger",
        )
        self.colleague_user = User.objects.create_user(
            role=self.colleague_role,
            email="colleague@example.com",
            password="testpass123",
            firstname="Case",
            lastname="Worker",
        )

    def create_case_with_passenger(self, passenger_email="alice@example.com"):
        case = Case.objects.create(
            status=CaseState.IN_REVIEW.value,
            gdpr_consent=True,
        )
        passenger = Passenger.objects.create(
            case=case,
            first_name="Alice",
            last_name="Passenger",
            date_of_birth="1990-01-01",
            email=passenger_email,
        )
        return case, passenger

    def status_url(self, case):
        return reverse("case-status-update", kwargs={"case_id": case.id})

    def test_requires_authentication(self):
        # Arrange
        case, _ = self.create_case_with_passenger()
        payload = {"status": CaseState.ELIGIBLE.value}

        # Act
        response = self.client.post(self.status_url(case), payload, format="json")

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        case.refresh_from_db()
        self.assertEqual(case.status, CaseState.IN_REVIEW.value)
        self.assertEqual(len(mail.outbox), 0)

    def test_forbids_authenticated_non_colleague_users(self):
        # Arrange
        case, _ = self.create_case_with_passenger()
        self.client.force_authenticate(user=self.passenger_user)

        # Act
        response = self.client.post(
            self.status_url(case),
            {"status": CaseState.ELIGIBLE.value},
            format="json",
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        case.refresh_from_db()
        self.assertEqual(case.status, CaseState.IN_REVIEW.value)
        self.assertEqual(len(mail.outbox), 0)

    def test_returns_not_found_without_sending_an_email_for_missing_case(self):
        # Arrange
        self.client.force_authenticate(user=self.colleague_user)

        # Act
        response = self.client.post(
            reverse("case-status-update", kwargs={"case_id": 999999}),
            {"status": CaseState.ELIGIBLE.value},
            format="json",
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"message": "Case not found."})
        self.assertEqual(len(mail.outbox), 0)

    def test_rejects_non_decision_status_without_updating_or_emailing(self):
        # Arrange
        case, _ = self.create_case_with_passenger()
        self.client.force_authenticate(user=self.colleague_user)

        # Act
        response = self.client.post(
            self.status_url(case),
            {"status": CaseState.PENDING.value},
            format="json",
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Status must be", response.data["error"])
        case.refresh_from_db()
        self.assertEqual(case.status, CaseState.IN_REVIEW.value)
        self.assertEqual(len(mail.outbox), 0)

    def test_colleague_can_apply_each_decision_and_notify_the_passenger(self):
        # Arrange
        decisions = (
            (CaseState.ELIGIBLE.value, "Eligible", ""),
            (
                CaseState.NON_ELIGIBLE.value,
                "Non-Eligible",
                "The itinerary does not meet the eligibility requirements.",
            ),
            (
                CaseState.AWAITING_DOCUMENTS.value,
                "Awaiting Documents",
                "Please upload your boarding pass and booking confirmation.",
            ),
        )
        self.client.force_authenticate(user=self.colleague_user)

        for case_status, status_label, note in decisions:
            with self.subTest(case_status=case_status):
                case, passenger = self.create_case_with_passenger()
                mail.outbox.clear()

                # Act
                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.post(
                        self.status_url(case),
                        {"status": case_status, "note": note},
                        format="json",
                    )

                # Assert
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(
                    response.data,
                    {"message": "Case status updated successfully."},
                )
                case.refresh_from_db()
                self.assertEqual(case.status, case_status)

                self.assertEqual(len(mail.outbox), 1)
                email = mail.outbox[0]
                self.assertEqual(email.to, [passenger.email])
                self.assertEqual(email.subject, f"Update for {case.id}")
                self.assertEqual(email.content_subtype, "html")
                self.assertIn("Hello Alice", email.body)
                self.assertIn(f"Case ID:</strong> {case.id}", email.body)
                self.assertIn(f"New status:</strong> {status_label}", email.body)
                self.assertIn("This email was generated by AirAssist.", email.body)

                if note:
                    self.assertIn("Additional details:", email.body)
                    self.assertIn(note, email.body)
                else:
                    self.assertNotIn("Additional details:", email.body)

    def test_updates_case_without_email_when_passenger_has_no_email(self):
        # Arrange
        case, _ = self.create_case_with_passenger(passenger_email="")
        self.client.force_authenticate(user=self.colleague_user)

        # Act
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.status_url(case),
                {"status": CaseState.ELIGIBLE.value},
                format="json",
            )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        case.refresh_from_db()
        self.assertEqual(case.status, CaseState.ELIGIBLE.value)
        self.assertEqual(len(mail.outbox), 0)