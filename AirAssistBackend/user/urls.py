
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # View for obtaining access + refresh tokens
    TokenRefreshView      # View for refreshing expired access tokens
)

from . import views

urlpatterns = [
    path("", views.UserView.as_view(), name="user-create"),
    path("<int:user_id>/", views.UserRoleView.as_view(), name="user-role"),
    path("login/", views.LoginView.as_view(), name="login"),
    path('token/', TokenObtainPairView.as_view(), name='token_optain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]