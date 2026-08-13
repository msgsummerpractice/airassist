from typing import Optional, Tuple

from ..enums.cancellation_type_enum import CancellationType
from ..enums.delay_type_enum import DelayType
from ..enums.denied_boarding_type_enum import DeniedBoardingType
from ..enums.disruption_type_enum import DisruptionMotive
from ..models.case import Case
from ..models.disruption import Disruption


class CaseEligibilityService:
    @staticmethod
    def check_case_eligibility(case: Case) -> bool:
        disruption = case.disruptions.order_by("-created_at").first()
        if not disruption:
            raise ValueError("No disruption found for the case.")
        is_eligible, _ = CaseEligibilityService.check_disruption_eligibility_with_reason(disruption)
        return is_eligible

    @staticmethod
    def check_case_eligibility_with_reason(case: Case) -> Tuple[bool, Optional[str]]:
        disruption = case.disruptions.order_by("-created_at").first()
        if not disruption:
            raise ValueError("No disruption found for the case.")
        return CaseEligibilityService.check_disruption_eligibility_with_reason(disruption)

    @staticmethod
    def check_disruption_eligibility(disruption: Disruption) -> bool:
        is_eligible, _ = CaseEligibilityService.check_disruption_eligibility_with_reason(disruption)
        return is_eligible

    @staticmethod
    def check_disruption_eligibility_with_reason(disruption: Disruption) -> Tuple[bool, Optional[str]]:
        match disruption.motive:
            case DisruptionMotive.CANCELATION.value:
                return CaseEligibilityService.check_cancelation_eligibility_with_reason(disruption)
            case DisruptionMotive.DELAY.value:
                return CaseEligibilityService.check_delay_eligibility_with_reason(disruption)
            case DisruptionMotive.DENIED_BOARDING.value:
                return CaseEligibilityService.check_denied_boarding_eligibility_with_reason(disruption)
            case _:
                return False, "Unsupported disruption motive."

    @staticmethod
    def check_cancelation_eligibility_with_reason(disruption: Disruption) -> Tuple[bool, Optional[str]]:
        if disruption.cancellation_type == CancellationType.MORE_THAN_14_DAYS.value:
            return False, "Not eligible: cancellation was announced more than 14 days before departure."
        if disruption.delay_type == DelayType.LESS_THAN_3_HOURS.value:
            return False, "Not eligible: resulting delay is less than 3 hours."
        return True, None

    @staticmethod
    def check_delay_eligibility_with_reason(disruption: Disruption) -> Tuple[bool, Optional[str]]:
        if disruption.delay_type == DelayType.LESS_THAN_3_HOURS.value:
            return False, "Not eligible: delay is less than 3 hours."
        return True, None

    @staticmethod
    def check_denied_boarding_eligibility_with_reason(disruption: Disruption) -> Tuple[bool, Optional[str]]:
        if disruption.denied_boarding_type == DeniedBoardingType.NO.value:
            return False, "Not eligible: denied boarding was not confirmed."
        if disruption.delay_type == DelayType.LESS_THAN_3_HOURS.value:
            return False, "Not eligible: resulting delay is less than 3 hours."
        return True, None