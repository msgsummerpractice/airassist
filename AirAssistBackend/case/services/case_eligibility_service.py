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
        
        return CaseEligibilityService.check_disruption_eligibility(disruption)

    
    @staticmethod
    def check_disruption_eligibility(disruption: Disruption) -> bool:
        match disruption.motive:
            case DisruptionMotive.CANCELATION.value:
                return CaseEligibilityService.check_cancelation_eligibility(disruption)
            case DisruptionMotive.DELAY.value:
                return CaseEligibilityService.check_delay_eligibility(disruption)
            case DisruptionMotive.DENIED_BOARDING.value:
                return CaseEligibilityService.check_denied_boarding_eligibility(disruption)
            case _:
                    return False              

    @staticmethod
    def check_cancelation_eligibility(disruption: Disruption) -> bool:
        if disruption.delay_type == DelayType.LESS_THAN_3_HOURS.value:
                        return False
        if disruption.cancellation_type  == CancellationType.MORE_THAN_14_DAYS.value:
                        return False
        return True

    @staticmethod
    def check_delay_eligibility(disruption: Disruption) -> bool:
        if disruption.delay_type == DelayType.LESS_THAN_3_HOURS.value:
            return False
        return True

    @staticmethod
    def check_denied_boarding_eligibility(disruption: Disruption) -> bool:
        if disruption.delay_type == DelayType.LESS_THAN_3_HOURS.value:
            return False
        if disruption.denied_boarding_type == DeniedBoardingType.NO.value:
            return False
        return True
    