from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..service.user_service import UserService
from ..serializers.user_serializer import UserSerializer, UserRoleSerializer, LoginSerializer
from ..permissions import IsSystemAdmin
from rest_framework.permissions import IsAuthenticated
from ..custom_exceptions.responses import AirAssistResponse

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
        return airassist_response.status_bad_request(request.data)
    
class UserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, user_id):
        role = UserService.get_user_role(user_id)
        serializer = UserRoleSerializer(role)
        return Response(serializer.data)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        airassist_response = AirAssistResponse()
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)

            response_data = airassist_response.status_login_success(refresh)
            if user.must_change_password:
                response_data["must_change_password"] = True

            return Response(response_data)
        return airassist_response.status_forbidden_with_message("Invalid email or password")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get("new_password")

        if not new_password:
            return Response({"error": "New password is required."}, status = status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.set_password(new_password)

        user.must_change_password = False
        user.save(update_fields = ["password", "must_change_password"])

        return Response({"message": "Password changed successfully."}, status = status.HTTP_200_OK)