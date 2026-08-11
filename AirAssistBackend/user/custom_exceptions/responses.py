from rest_framework import status
from rest_framework.response import Response

class AirAssistResponse:
    def status_create(self, data):
        return Response(data,status=status.HTTP_201_CREATED)

    def status_bad_request(self, data):
        return Response(data, status=status.HTTP_400_BAD_REQUEST)

    def status_bad_request_with_message(self, message):
        return Response({"message": message}, status=status.HTTP_400_BAD_REQUEST)

    def status_no_content(self):
        return Response({'message':f"Request completed successfully"},status=status.HTTP_204_NO_CONTENT)

    def status_ok(self,data):
        return Response(data,status=status.HTTP_200_OK)

    def status_forbidden_with_message(self, message):
        return Response({"message": message}, status=status.HTTP_403_FORBIDDEN)

    def status_login_success(self):
        return {
            "message": "Successfully logged in",
        }

        
