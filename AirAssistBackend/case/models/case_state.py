from django.db import models


class State(models.TextChoices):
    NEW = "NEW", "New"
    VALID = "VALID", "Eligible"
    ASSIGNED = "ASSIGNED", "Assigned"
    INVALID = "INVALID", "Invalid"