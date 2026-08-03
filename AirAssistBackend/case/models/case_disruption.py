

from django.db import models
from disruption_type import DisruptionMotive

class Disruption(models.Model):
    case = models.ForeignKey("Case", on_delete=models.CASCADE, related_name="distruptions",)
    motive = models.CharField(
        max_length=20,
        choices=DisruptionMotive.choices(),
    )

    incident_description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Disruption {self.motive} (Case {self.case_id})"