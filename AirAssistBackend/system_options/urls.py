from django.urls import path

from .views.system_option_view import SystemOptionView


urlpatterns = [
    path("system-options/", SystemOptionView.as_view(), name="system-options"),
]
