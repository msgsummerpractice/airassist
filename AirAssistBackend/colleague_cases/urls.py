from django.urls import path

from .views.colleague_case_creation_view import ColleagueCaseCreationView
from .views.colleague_case_list_view import ColleagueCaseListView


urlpatterns = [
    path('cases/colleague/', ColleagueCaseCreationView.as_view(), name='colleague-case-create'),
    path("cases/colleague/list/", ColleagueCaseListView.as_view(), name="colleague-case-list"),

]