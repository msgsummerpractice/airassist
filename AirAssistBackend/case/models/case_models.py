from django.db import models

from .case_state import CaseState

# Create your models here.

class Case(models.Model):
    status = models.CharField(
        max_length=20,
        choices=CaseState.choices(),
        default=CaseState.NEW.value,
    )

    gdpr_consent = models.BooleanField(default=False)
    gdpr_consent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Case {self.id}"