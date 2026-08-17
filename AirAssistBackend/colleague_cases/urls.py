from django.urls import path

from .views.colleague_case_comment_view import ColleagueCaseCommentCreateView
from .views.colleague_case_creation_view import ColleagueCaseCreationView
from .views.colleague_case_details import ColleagueCaseDetailsView
from .views.colleague_case_list_view import ColleagueCaseListView
from .views.colleague_case_document_view import (ColleagueCaseDocumentUploadSerializer, ColleagueCaseDocumentDownloadView)

urlpatterns = [
    path('cases/colleague/', ColleagueCaseCreationView.as_view(), name='colleague-case-create'),
    path("cases/colleague/list/", ColleagueCaseListView.as_view(), name="colleague-case-list"),
    path("cases/colleague/<int:pk>/", ColleagueCaseDetailsView.as_view(), name="colleague-case-details"),
    path("cases/colleague/<int:pk>/comments/", ColleagueCaseCommentCreateView.as_view(), name="colleague-case-comment-create"),
    path("cases/colleague/<int:pk>/documents", ColleagueCaseDocumentUploadSerializer.as_view(), name = "colleague-case-document-upload"),
    path("cases/colleague/<int:pk>/documents/<int:document_id>/download/",ColleagueCaseDocumentDownloadView.as_view(),name="colleague-case-document-download"),

]