
from django.urls import path

from . import views

urlpatterns = [
    path("", views.UserView.as_view(), name="user-create"),
    path("<int:user_id>", views.UserRoleView.as_view(), name="user-role"),
]