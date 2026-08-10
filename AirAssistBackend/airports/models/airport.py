from django.db import models

# Create your models here.
class Airport(models.Model):
    iata = models.CharField(max_length=3, primary_key=True, unique=True)
    icao = models.CharField(max_length=4, null=True, blank=True)

    name = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    altitude = models.IntegerField(null=True, blank=True)
    timezone = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.iata})"