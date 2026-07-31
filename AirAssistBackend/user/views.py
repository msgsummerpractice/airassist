from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .service import UserService
from .models import User
from .serializers import UserSerializer, UserRoleSerializer, LoginSerializer
from .permissions import IsSystemAdmin
from rest_framework.permissions import IsAuthenticated

# Create your views here.
class UserView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        role = UserService.get_user_role(user_id)
        serializer = UserRoleSerializer(role)
        return Response(serializer.data)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Success",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK,
            )
        return Response({"detail": "forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
