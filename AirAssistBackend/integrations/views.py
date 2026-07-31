from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import Airport
from .airport_gap_client import AirportGapClient 

class PopulateAirportsView(APIView):
    # Set to AllowAny for testing, but consider changing to IsAdminUser for production
    permission_classes = [AllowAny] 

    def post(self, request):
        client = AirportGapClient()
        
        try:
            # 1. Fetch ALL airports from the API using your client method[cite: 9]
            all_airports_data = client.get_all_airports()
            saved_count = 0

            # 2. Loop through the list and save to the database
            for airport_item in all_airports_data:
                attrs = airport_item.get('attributes', {})
                iata = attrs.get('iata')
                
                # Some API entries might lack an IATA code; skip those to prevent DB errors
                if not iata:
                    continue

                # 3. Update or create the database record using the Airport model[cite: 10]
                Airport.objects.update_or_create(
                    iata=iata,
                    defaults={
                        'icao': attrs.get('icao'),
                        'name': attrs.get('name'),
                        'city': attrs.get('city'),
                        'country': attrs.get('country'),
                        'latitude': attrs.get('latitude'),
                        'longitude': attrs.get('longitude'),
                        'altitude': attrs.get('altitude'),
                        'timezone': attrs.get('timezone'),
                    }
                )
                saved_count += 1
                
            return Response(
                {
                    "success": True, 
                    "message": f"Successfully populated {saved_count} airports into the database."
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )