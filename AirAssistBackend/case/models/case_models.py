from django.db import models
from .case_state import State

class Case(models.Model):
    status = models.CharField(
        max_length=20,
        choices=State.choices,
        default=State.NEW,
    )

    assigned_colleague = models.ForeignKey(
        "user.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_cases",
    )

    gdpr_consent = models.BooleanField(default=True)
    gdpr_consent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Case{self.id}"