from django.test import TestCase

from case.enums.delay_type_enum import DelayType
from case.enums.disruption_type_enum import DisruptionMotive
from case.serializers.disruption_serializer import DisruptionSerializer


class DisruptionSerializerTests(TestCase):
    def test_allows_partial_answers_for_cancellation(self):
        serializer = DisruptionSerializer(
            data={
                "motive": DisruptionMotive.CANCELATION.value,
                "incident_description": "Flight was canceled at the gate.",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_preserves_choice_validation_for_present_fields(self):
        serializer = DisruptionSerializer(
            data={
                "motive": DisruptionMotive.DELAY.value,
                "delay_type": DelayType.MORE_THAN_3_HOURS.value,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rejects_invalid_choice_values(self):
        serializer = DisruptionSerializer(
            data={
                "motive": DisruptionMotive.DELAY.value,
                "delay_type": "NOT_A_REAL_DELAY_TYPE",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("delay_type", serializer.errors)