from django.db import transaction
from django.utils import timezone

from case.enums.case_state_enum import CaseState
from case.enums.document_type_enum import DocumentType
from case.models.case import Case
from case.models.disruption import Disruption
from case.models.document import CaseDocument
from case.models.flights import Flight
from case.models.passengers import Passenger
from user.enums.roles import Roles


class ColleagueCaseCreationService:
    @staticmethod
    def get_assigned_cases_for_colleague(colleague):
        cases = (
            Case.objects.filter(assigned_colleague=colleague)
            .prefetch_related("passengers")
            .order_by("-created_at")
        )

        claims = []
        for case in cases:
            passenger = case.passengers.first()
            passenger_name = None

            if passenger is not None:
                passenger_name = f"{passenger.first_name} {passenger.last_name}"

            claims.append(
                {
                    "case_id": case.id,
                    "status": case.status,
                    "created_at": case.created_at,
                    "reservation_number": case.reservation_number,
                    "passenger_name": passenger_name,
                }
            )

        return claims

    @staticmethod
    def build_dashboard_payload(colleague):
        role_name = getattr(getattr(colleague, "role", None), "role", None)

        return {
            "colleague": {
                "id": colleague.id,
                "firstname": colleague.firstname,
                "lastname": colleague.lastname,
                "full_name": f"{colleague.firstname} {colleague.lastname}".strip(),
                "email": colleague.email,
                "role": role_name,
                "avatar_url": None,
            },
            "claims": ColleagueCaseCreationService.get_assigned_cases_for_colleague(
                colleague
            ),
        }

    @staticmethod
    def link_colleague_to_case(case, colleague):
        role_name = getattr(getattr(colleague, "role", None), "role", None)
        if role_name != Roles.COLLEAGUE.value:
            raise ValueError("Only colleagues can be linked to a case.")

        case.assigned_colleague = colleague
        case.save(update_fields=["assigned_colleague", "updated_at"])
        return case

    @staticmethod
    @transaction.atomic
    def create_case(validated_data):
        boarding_pass = validated_data.pop("boarding_pass")
        passport = validated_data.pop("passport")
        connection_flights = validated_data.pop("connection_flights", [])
        disruption = validated_data.pop("disruption")

        gdpr_consent = validated_data["gdpr_consent"]
        case = Case.objects.create(
            status=CaseState.PENDING.value,
            reservation_number=validated_data.get("reservation_number"),
            gdpr_consent=gdpr_consent,
            gdpr_consent_at=timezone.now() if gdpr_consent else None,
        )

        Disruption.objects.create(case=case, **disruption)

        Flight.objects.create(
            case=case,
            flight_date=validated_data["flight_date"],
            flight_number=validated_data["flight_number"],
            airline=validated_data["airline"],
            reservation_number=validated_data["reservation_number"],
            departing_airport=validated_data["departing_airport"],
            destination_airport=validated_data["destination_airport"],
            planned_departure_time=validated_data["planned_departure_time"].time(),
            planned_arrival_time=validated_data["planned_arrival_time"].time(),
            is_problem_flight=validated_data["is_problem_flight"],
            is_main_flight=True,
        )

        for flight in connection_flights:
            Flight.objects.create(
                case=case,
                flight_date=flight["flight_date"],
                flight_number=flight["flight_number"],
                airline=flight["airline"],
                reservation_number=flight["reservation_number"],
                departing_airport=flight["departing_airport"],
                destination_airport=flight["destination_airport"],
                planned_departure_time=flight["planned_departure_time"].time(),
                planned_arrival_time=flight["planned_arrival_time"].time(),
                is_problem_flight=flight["is_problem_flight"],
                is_main_flight=False,
            )

        CaseDocument.objects.create(
            case=case,
            document_type=DocumentType.BOARDING_PASS.value,
            file=boarding_pass,
            original_filename=boarding_pass.name,
            content_type=getattr(boarding_pass, "content_type", ""),
            file_size=boarding_pass.size,
        )

        CaseDocument.objects.create(
            case=case,
            document_type=DocumentType.PASSPORT.value,
            file=passport,
            original_filename=passport.name,
            content_type=getattr(passport, "content_type", ""),
            file_size=passport.size,
        )

        Passenger.objects.create(
            case=case,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            date_of_birth=validated_data["date_of_birth"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            address=validated_data["address"],
            postal_code=validated_data["postal_code"],
        )

        return case