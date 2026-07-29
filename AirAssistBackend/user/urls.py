
from django.urls import path

from . import views

urlpatterns = [
    path("", views.User.as_view(), name="user-create"),
]