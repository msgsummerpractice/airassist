from django.urls import path
from .views.airport_views import AirportLookupView, AirportSearchView, PopulateAirportsView
from .views.airport_views import CalculateDistanceView

urlpatterns = [
    path('airports/populate/', PopulateAirportsView.as_view(), name='airport-populate'),
    path('airports/distance/', CalculateDistanceView.as_view(), name='airport-distance'),
    path('airports/search/', AirportSearchView.as_view(), name='airport-search'),
    path('airports/<str:iata>/', AirportLookupView.as_view(), name='airport-lookup'),
]