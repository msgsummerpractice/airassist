from rest_framework import status
from rest_framework.response import Response
from constants import *
class Exceptions:

    def status_bad_request(self,serializer):
            return Response({AIRASSIST_BACKEND},serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def status_bad_request_with_message(self,message):
        return Response({AIRASSIST_BACKEND},{'message':message},status=status.HTTP_400_BAD_REQUEST)

    def status_unauthorized(self,serializer):
        return Response({AIRASSIST_BACKEND},serializer.errors,status=status.HTTP_401_UNAUTHORIZED)

    def status_forbidden(self,serializer):
        return Response({AIRASSIST_BACKEND},serializer.errors,status=status.HTTP_403_FORBIDDEN)

    def status_forbidden_with_message(self,message):
        return Response({AIRASSIST_BACKEND},{'message':message},status=status.HTTP_403_FORBIDDEN)

    def status_not_found(self,serializer):
        return Response({AIRASSIST_BACKEND},serializer.errors,status=status.HTTP_404_NOT_FOUND)

    def status_internal_server_error(self,serializer):
        return Response({AIRASSIST_BACKEND},serializer.errors,status=status.HTTP_500_INTERNAL_SERVER_ERROR) 

    def status_not_found_with_message(self, message):
        return Response({AIRASSIST_BACKEND},{"message": message}, status=status.HTTP_404_NOT_FOUND)
        
