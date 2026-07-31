from django.urls import path
from .views import PopulateAirportsView

urlpatterns = [
    path('airports/populate/', PopulateAirportsView.as_view(), name='airport-populate'),
]