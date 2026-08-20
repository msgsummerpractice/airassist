from ..custom_exceptions.exceptions import BadRequestAPIException
from ..models.case import Case
from ..enums.case_state_enum import CaseState


class CaseStateService:
    @staticmethod
    def mark_case_as_assigned(case: Case, colleague) -> Case:
        if case.status != CaseState.PENDING.value:
            raise BadRequestAPIException("Only PENDING cases can be assigned for review.")
        case.assigned_colleague = colleague
        case.status = CaseState.IN_REVIEW.value
        case.save(update_fields=["assigned_colleague", "status", "updated_at"])
        return case


