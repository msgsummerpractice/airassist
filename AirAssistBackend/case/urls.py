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
from .views.case_creation_view import CaseCreationView
from .views.case_eligibility_view import CaseEligibilityUpdateView, CaseEligibilityView
from .views.case_assigment_view import CaseAssignmentView
from .views.passenger_case_list_view import PassengerCaseListView

urlpatterns = [
    path('cases/', CaseCreationView.as_view(), name='case-create'),
    path("cases/me/", PassengerCaseListView.as_view(), name="passenger-case-list"),
    path("cases/<int:case_id>/eligibility/", CaseEligibilityUpdateView.as_view(), name="case-eligibility"),
    path("cases/<int:case_id>/eligibility-check/", CaseEligibilityView.as_view(), name="case-eligibility-check"),
    path("cases/<int:case_id>/eligibility-update/", CaseEligibilityUpdateView.as_view(), name="case-eligibility-update"),
    path("cases/<int:case_id>/assign/", CaseAssignmentView.as_view(), name="case-assign"),
]
