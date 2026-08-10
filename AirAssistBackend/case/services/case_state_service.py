from ..models.case import Case
from ..enums.case_state_enum import CaseState


class CaseStateService:
    @staticmethod
    def mark_case_as_valid(case: Case) -> Case:
        if case.status != CaseState.NEW.value:
            raise ValueError("Only NEW cases can be marked as VALID.")
        case.status = CaseState.VALID.value
        case.save(update_fields=["status", "updated_at"])
        return case

    @staticmethod
    def mark_case_as_invalid(case: Case) -> Case:
        if case.status != CaseState.NEW.value:
            raise ValueError("Only NEW cases can be marked as INVALID.")
        case.status = CaseState.INVALID.value
        case.save(update_fields=["status", "updated_at"])
        return case

    @staticmethod
    def mark_case_as_assigned(case: Case, colleague) -> Case:
        if case.status != CaseState.VALID.value:
            raise ValueError("Only VALID cases can be marked as ASSIGNED.")
        case.assigned_colleague = colleague
        case.status = CaseState.ASSIGNED.value
        case.save(update_fields=["status", "updated_at"])
        return case

    @staticmethod
    def mark_case_as_eligible(case: Case, is_eligible: bool) -> Case:
        if case.status != CaseState.NEW.value:
            raise ValueError("Eligibility can only be checked for NEW cases.")

        if is_eligible:
            return CaseStateService.mark_case_as_valid(case)

        return CaseStateService.mark_case_as_invalid(case)
