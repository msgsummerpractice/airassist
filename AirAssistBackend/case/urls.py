"""
URL configuration for AirAssistBackend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

from .views.case_status_update_view import CaseStatusUpdateView
from .views.case_contract_download_view import CaseContractDownloadView

from .views.admin_case_list_view import AdminCaseListView
from .views.case_deletion_view import CaseDeletionView

from .views.case_creation_view import CaseCreationView
from .views.case_eligibility_view import CaseEligibilityView
from .views.case_assigment_view import CaseAssignmentView
from .views.passenger_case_comment_view import PassengerCaseCommentCreateView
from .views.passenger_case_document_download_view import PassengerCaseDocumentDownloadView
from .views.passenger_case_list_view import PassengerCaseListView
from .views.passenger_case_details_view import PassengerCaseDetailsView
from .views.pdf_history_list_view import PdfHistoryListView
from .views.pdf_history_download_view import PdfHistoryDownloadView

urlpatterns = [
    path('cases/', CaseCreationView.as_view(), name='case-create'),
    path('cases/admin/', AdminCaseListView.as_view(), name='admin-case-list'),
    path('cases/admin/<int:case_id>/',
         CaseDeletionView.as_view(), name='case-delete'),
    path('cases/<int:case_id>/contract/',
         CaseContractDownloadView.as_view(), name='case-contract-download'),
    path("cases/<int:case_id>/eligibility-check/",
         CaseEligibilityView.as_view(), name="case-eligibility-check"),
    path("cases/me/", PassengerCaseListView.as_view(), name="passenger-case-list"),
    path("cases/eligibility-check/", CaseEligibilityView.as_view(),
         name="case-eligibility-check"),
    path("cases/<int:case_id>/assign/",
         CaseAssignmentView.as_view(), name="case-assign"),
    path("cases/me/<int:pk>/", PassengerCaseDetailsView.as_view(),
         name="passenger-case-details"),
    path("cases/me/<int:pk>/comments/", PassengerCaseCommentCreateView.as_view(),
         name="passenger-case-comment-create"),
    path("cases/documents/", PdfHistoryListView.as_view(), name="pdf-history-list"),
    path("cases/documents/<int:document_id>/download/",
         PdfHistoryDownloadView.as_view(), name="pdf-history-download"),
]
    path("cases/eligibility-check/", CaseEligibilityView.as_view(), name="case-eligibility-check"),
    path("cases/<int:case_id>/assign/", CaseAssignmentView.as_view(), name="case-assign"),
    path("cases/me/<int:pk>/", PassengerCaseDetailsView.as_view(), name="passenger-case-details"),
    path(
        "cases/me/<int:pk>/documents/<int:document_id>/download/",
        PassengerCaseDocumentDownloadView.as_view(),
        name="passenger-case-document-download",
    ),
    path("cases/me/<int:pk>/comments/", PassengerCaseCommentCreateView.as_view(), name="passenger-case-comment-create"),
    path(
    "cases/<int:case_id>/status/",
    CaseStatusUpdateView.as_view(),
    name="case-status-update",
)
] 
