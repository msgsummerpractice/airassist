
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # View for obtaining access + refresh tokens
    TokenRefreshView      # View for refreshing expired access tokens
)

from .views import user_view as views

urlpatterns = [
    path("", views.UserView.as_view(), name="user-create"),
    path("<int:user_id>/role/", views.GetUserRoleView.as_view(), name="user-role"),
    path("<int:user_id>/delete/", views.DeleteUserView.as_view(), name="user-delete"),
    path("<int:user_id>/profile/", views.UpdateUserProfileView.as_view(), name="user-profile-update"),
    path("login/", views.LoginView.as_view(), name="login"),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('request-password-reset/', views.RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path("colleagues/", views.ColleagueListView.as_view(), name="colleague-list"),
]