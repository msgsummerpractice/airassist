

class CompensationService:
    @staticmethod
    def calculate_compensation(distance_km):
        if distance_km <= 1500:
            return 250

        elif distance_km <= 3500:
            return 400

        else:
            return 600