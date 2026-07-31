from django.db import models

# Create your models here.

class Case(models.Model):

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        INCOMPLETE = "INCOMPLETE", "Incomplete"
        VALID = "VALID", "Valid"
        REJECTED = "REJECTED", "Rejected" 

    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.NEW,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Case{self.id}"