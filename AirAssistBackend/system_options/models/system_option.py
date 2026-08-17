from django.db import models

from ..enums import SystemOptionType


class SystemOption(models.Model):
    option_type = models.CharField(
        max_length=40,
        choices=SystemOptionType.choices(),
        unique=True,
    )
    configuration = models.JSONField(default=dict)
    updated_by = models.ForeignKey(
        "user.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_system_options",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["option_type"]

    def __str__(self):
        return self.option_type
