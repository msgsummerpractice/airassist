from .airport_gap_client import AirportGapClient

class DistanceService:

    @staticmethod
    def calculate_orthodromic_distance(from_airport,to_airport):

        client = AirportGapClient()

        result = client.get_airport_distance(from_airport,to_airport)

        return round(result["data"]["attributes"]["kilometers"],2)