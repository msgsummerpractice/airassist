from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..service.user_service import UserService
from ..serializers.user_serializer import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserListSerializer,
    UserProfileUpdateSerializer,
    UserRoleSerializer,
    UserSerializer,
)
from ..permissions import IsSystemAdmin
from rest_framework.permissions import IsAuthenticated
from ..custom_exceptions.responses import AirAssistResponse

from colleague_cases.permissions import IsColleague
from ..enums.roles import Roles
from ..models.users import User


class ColleagueListView(APIView):
    permission_classes = [IsAuthenticated, IsColleague]

    def get(self, request):
        colleagues = User.objects.filter(
            role__role=Roles.COLLEAGUE.value,
            is_active=True,
        ).order_by("lastname", "firstname")

        data = [
            {
                "id": colleague.id,
                "firstname": colleague.firstname,
                "lastname": colleague.lastname,
                "email": colleague.email,
            }
            for colleague in colleagues
        ]

        return Response(data, status=status.HTTP_200_OK)

# Create your views here.


class UserView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        airassist_response = AirAssistResponse()
        if serializer.is_valid():
            try:
                user = UserService.create_user(
                    role_name=serializer.validated_data['role'].role,
                    firstname=serializer.validated_data['firstname'],
                    lastname=serializer.validated_data['lastname'],
                    email=serializer.validated_data['email'],
                    password=serializer.validated_data['password'],
                    must_change_password=True
                )
                user_data = UserSerializer(user).data
                return airassist_response.status_create(user_data)
            except ValueError as e:
                return airassist_response.status_bad_request_with_message(str(e))
        return airassist_response.status_bad_request(serializer.errors)

    def get(self, request):
        airassist_response = AirAssistResponse()
        users = UserService.get_users_for_admin_list()
        serializer = UserListSerializer(users, many=True)
        return airassist_response.status_ok(serializer.data)


class GetUserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        role = UserService.get_user_role(user_id)
        serializer = UserRoleSerializer(role)
        return Response(serializer.data)


class DeleteUserView(APIView):
    permission_classes = [IsSystemAdmin]

    def delete(self, request, user_id):
        try:
            result = UserService.delete_user_account(
                requesting_user_id=request.user.id,
                target_user_id=user_id,
            )
        except ValueError as exc:
            message = str(exc)
            if message == "User not found.":
                return Response({"message": message}, status=status.HTTP_404_NOT_FOUND)
            return Response({"message": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": "User account deleted successfully.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


class UpdateUserProfileView(APIView):
    permission_classes = [IsSystemAdmin]

    def patch(self, request, user_id):
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserProfileUpdateSerializer(
            target_user, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = UserService.update_user_profile(
                requesting_user_id=request.user.id,
                target_user_id=user_id,
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserListSerializer(user).data, status=status.HTTP_200_OK)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        airassist_response = AirAssistResponse()
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            # add role so the frontend can read it without a round-trip
            refresh["role"] = user.role.role
            response_data = airassist_response.status_login_success()
            response_data["must_change_password"] = user.must_change_password
            response_data["refresh"] = str(refresh)
            response_data["access"] = str(refresh.access_token)

            return Response(response_data, status=status.HTTP_200_OK)
        return airassist_response.status_forbidden_with_message("Invalid email or password")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get("new_password")

        try:
            UserService.change_password(request.user, new_password)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        frontend_base_url = request.headers.get(
            "Origin") or "http://localhost:5173"
        UserService.send_password_reset_email(
            email=serializer.validated_data["email"],
            frontend_base_url=frontend_base_url,
        )

        return Response(
            {
                "message": "If an account exists for that email, a password reset link has been sent.",
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            UserService.reset_password_with_token(
                uid=serializer.validated_data["uid"],
                token=serializer.validated_data["token"],
                new_password=serializer.validated_data["new_password"],
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )
