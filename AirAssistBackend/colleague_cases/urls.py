from django.urls import path

from .views.colleague_case_creation_view import ColleagueCaseCreationView


urlpatterns = [
    path('cases/colleague/', ColleagueCaseCreationView.as_view(), name='colleague-case-create'),
]