

from django.db import models
from ..enums.disruption_type_enum import DisruptionMotive
from ..enums.cancellation_type_enum import CancellationType
from ..enums.delay_type_enum import DelayType
from ..enums.denied_boarding_type_enum import DeniedBoardingType
from ..enums.denied_boarding_reason_type_enum import DeniedBoardingReasonType
from ..enums.airline_motive_mentioned_enum import AirlineMotiveMentioned
from ..enums.airline_motive_enum import AirlineMotive


class Disruption(models.Model):
    case = models.ForeignKey("Case", on_delete=models.CASCADE, related_name="disruptions",)
    motive = models.CharField(
        max_length=20,
        choices=DisruptionMotive.choices(),
    )

    cancellation_type = models.CharField(
        max_length = 30,
        choices = CancellationType.choices(),
        null = True,
        blank = True,
    )

    delay_type = models.CharField(
        max_length = 30,
        choices = DelayType.choices(),
        null = True,
        blank = True,
    )

    denied_boarding_type = models.CharField(
        max_length = 10,
        choices = DeniedBoardingType.choices(),
        null = True,
        blank = True,
    )

    denied_boarding_reason = models.CharField(
        max_length = 30,
        choices = DeniedBoardingReasonType.choices(),
        null = True,
        blank = True,
    )

    airline_motive_mentioned = models.CharField(
        max_length = 15,
        choices = AirlineMotiveMentioned.choices(),
        null = True,
        blank = True,
    )

    airline_motive = models.CharField(
        max_length = 30,
        choices = AirlineMotive.choices(),
        null = True,
        blank = True,
    )

    incident_description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Disruption {self.motive} (Case {self.case_id})"