from django.db import models
from .case import Case
from ..enums.document_type_enum import DocumentType

class CaseDocument(models.Model):
    UPLOADER_CHOICES = [
        ("PASSENGER", "Passenger"),
        ("COLLEAGUE", "Colleague"),
    ]

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=30, choices=DocumentType.choices())
    uploaded_by = models.CharField(
        max_length=20,
        choices=UPLOADER_CHOICES,
        null=True,
        blank=True,
    )
    file = models.FileField(upload_to="case_documents/")
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)