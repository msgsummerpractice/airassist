from django.db import models

from ..enums.case_state_enum import CaseState
from ..enums.conversation_status_enum import ConversationStatus

# Create your models here.

class Case(models.Model):
    status = models.CharField(
        max_length=20,
        choices=CaseState.choices(),
        default=CaseState.PENDING.value,
    )

    conversation_status = models.CharField(
        max_length=10,
        choices=ConversationStatus.choices(),
        default=ConversationStatus.OPEN.value,
    )
    conversation_closed_at = models.DateTimeField(null=True, blank=True)
    conversation_closed_by = models.ForeignKey(
        "user.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="closed_case_conversations",
    )

    assigned_colleague = models.ForeignKey(
        "user.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_cases",
    )

    reservation_number = models.CharField(max_length=20, null=True, blank=True)
    gdpr_consent = models.BooleanField(default=False)
    gdpr_consent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    ##CompensationFields
    departure_airport = models.CharField(max_length=3,null=True,blank=True)
    arrival_airport = models.CharField(max_length=3,null=True,blank=True)
    distance_km = models.FloatField(null=True,blank=True)
    compensation_amount = models.DecimalField(max_digits=6,decimal_places=2,null=True,blank=True)

    
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Case {self.id}"