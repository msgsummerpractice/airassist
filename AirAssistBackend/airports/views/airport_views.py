from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAdminUser

from ..models.airport import Airport
from ..services.airport_gap_service import AirportGapClient 
from ..services.distance_service import DistanceService

class PopulateAirportsView(APIView):
    permission_classes = [IsAdminUser] 

    def post(self, request):
        client = AirportGapClient()
        
        try:
         
            all_airports_data = client.get_all_airports()
            saved_count = 0

    
            for airport_item in all_airports_data:
                attrs = airport_item.get('attributes', {})
                iata = attrs.get('iata')
                
              
                if not iata:
                    continue

              
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

class CalculateDistanceView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        from_airport = request.data.get("from")
        to_airport = request.data.get("to")

        if not from_airport or not to_airport:
            return Response(
                {
                    "error": "Both airports are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        distance = DistanceService.calculate_orthodromic_distance(
            from_airport,
            to_airport
        )


        return Response(
            distance,
            status=status.HTTP_200_OK
        )        


class AirportLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, iata):
        airport = Airport.objects.filter(iata=iata).first()
        if airport:
            return Response(
                {
                    "success": True,
                    "data": {
                        "iata": airport.iata,
                        "icao": airport.icao,
                        "name": airport.name,
                        "city": airport.city,
                        "country": airport.country,
                        "latitude": str(airport.latitude),
                        "longitude": str(airport.longitude),
                        "altitude": airport.altitude,
                        "timezone": airport.timezone,
                    }
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"success": False, "error": "Airport not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class AirportSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response([])

        airports = Airport.objects.filter(
            Q(iata__icontains=query) | Q(name__icontains=query) | Q(city__icontains=query)
        ).values("iata", "name", "city")[:10]
        return Response(list(airports)) 