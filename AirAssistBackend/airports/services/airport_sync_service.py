from ..services.airport_gap_service import AirportGapClient
from ..models.airport import Airport


class AirportSyncService:
    @staticmethod
    def populate_airports():
        client = AirportGapClient()
        saved_count = 0
        for airport_item in client.get_all_airports():
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
        return saved_count