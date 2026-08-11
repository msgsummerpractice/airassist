from rest_framework import status
from rest_framework.response import Response

class AirAssistResponse:
    def status_create(self, data):
        return Response(data,status=status.HTTP_201_CREATED)

    def status_no_content(self):
        return Response({'message':f"Request completed successfully"},status=status.HTTP_204_NO_CONTENT)

    def status_ok(self,data):
        return Response(data,status=status.HTTP_200_OK)

    def status_login_success(self):
        return Response({"Successfully logged in"},
        status=status.HTTP_200_OK)  

        
