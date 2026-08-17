from datetime import date, time

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.comment import Comment
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger
from user.enums.roles import Roles
from user.models.users import Role, User


class ColleagueCaseDetailsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.colleague_role = Role.objects.create(role=Roles.COLLEAGUE.value)
        self.passenger_role = Role.objects.create(role=Roles.PASSENGER.value)

        self.user = User.objects.create_user(
            role=self.colleague_role,
            firstname="Ada",
            lastname="Lovelace",
            email="ada@example.com",
            password="password-123",
        )
        User.objects.create_user(
            role=self.passenger_role,
            firstname="Grace",
            lastname="Hopper",
            email="passenger@example.com",
            password="password-123",
        )

        self.case = Case.objects.create(
            gdpr_consent=True,
            status="PENDING",
            reservation_number="ABC123",
            departure_airport="OTP",
            arrival_airport="FRA",
        )
        Passenger.objects.create(
            case=self.case,
            first_name="Grace",
            last_name="Hopper",
            date_of_birth=date(1990, 1, 1),
            email="passenger@example.com",
            phone="1234567890",
            address="Main Street 1",
            postal_code="12345",
        )
        Flight.objects.create(
            case=self.case,
            flight_date=date(2026, 8, 3),
            flight_number="LH123",
            airline="Lufthansa",
            reservation_number="ABC123",
            departing_airport="OTP",
            destination_airport="FRA",
            planned_departure_time=time(10, 0),
            planned_arrival_time=time(12, 0),
            is_problem_flight=True,
            is_main_flight=True,
        )
        Flight.objects.create(
            case=self.case,
            flight_date=date(2026, 8, 3),
            flight_number="LH456",
            airline="Lufthansa",
            reservation_number="ABC123",
            departing_airport="FRA",
            destination_airport="MUC",
            planned_departure_time=time(13, 0),
            planned_arrival_time=time(14, 0),
            is_problem_flight=False,
            is_main_flight=False,
        )
        CaseDocument.objects.create(
            case=self.case,
            document_type=DocumentType.PASSPORT.value,
            file=SimpleUploadedFile("passport.pdf", b"file", content_type="application/pdf"),
            original_filename="passport.pdf",
            content_type="application/pdf",
            file_size=4,
        )
        Comment.objects.create(
            case=self.case,
            author=self.user,
            text="Needs review",
        )

        self.url = reverse("colleague-case-details", kwargs={"pk": self.case.pk})

    def test_get_returns_case_details(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.case.id)
        self.assertEqual(response.data["status"], "PENDING")
        self.assertEqual(response.data["flight"]["flight_number"], "LH123")
        self.assertEqual(len(response.data["connecting_flights"]), 1)
        self.assertEqual(response.data["connecting_flights"][0]["flight_number"], "LH456")
        self.assertEqual(response.data["passenger"]["email"], "passenger@example.com")
        self.assertEqual(len(response.data["documents"]), 1)
        self.assertEqual(response.data["documents"][0]["document_type"], DocumentType.PASSPORT.value)
        self.assertEqual(response.data["comments"][0]["text"], "Needs review")
        self.assertEqual(response.data["comments"][0]["author_role"], Roles.COLLEAGUE.value)

    def test_get_returns_404_for_non_existing_case(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse("colleague-case-details", kwargs={"pk": 999999}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)