from rest_framework import status
from rest_framework.response import Response
from serializers import UserSerializer

class AirAssistResponse:
    def status_create(self, data):
        return Response(data,status=status.HTTP_201_CREATED)

    def status_no_content(self):
        return Response({'message':f"Request completed successfully"},status=status.HTTP_204_NO_CONTENT)

    def status_ok(self,data):
        return Response(data,status=status.HTTP_200_OK)

    def status_bad_request(self,serializer):
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def status_bad_request_with_message(self,message):
        return Response({'message':message},status=status.HTTP_400_BAD_REQUEST)

    def status_unauthorized(self,serializer):
        return Response(serializer.errors,status=status.HTTP_401_UNAUTHORIZED)

    def status_forbidden(self,serializer):
        return Response(serializer.errors,status=status.HTTP_403_FORBIDDEN)

    def status_forbidden_with_message(self,message):
        return Response({'message':message},status=status.HTTP_403_FORBIDDEN)

    def status_not_found(self,serializer):
        return Response(serializer.errors,status=status.HTTP_404_NOT_FOUND)

    def status_internal_server_error(self,serializer):
        return Response(serializer.errors,status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def status_login_success(self,refresh_token):
        return Response({'message':"Success",
                        'access':str(refresh_token.access_token),
                        'refresh':str(refresh_token)
                        },
        status=status.HTTP_200_OK)  
        
