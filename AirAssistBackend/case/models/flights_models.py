from django.db import models
from .case_models import Case


class Flight(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="flights")

    flight_date = models.DateField()
    flight_number = models.CharField(max_length=20)
    airline = models.CharField(max_length=50)
    reservation_number = models.CharField(max_length=20)
    departing_airport = models.CharField(max_length=3)
    destination_airport = models.CharField(max_length=3)
    planned_departure_time = models.TimeField()
    planned_arrival_time = models.TimeField()
    is_problem_flight = models.BooleanField(default=False)
    is_main_flight = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.flight_number} - {self.airline}"