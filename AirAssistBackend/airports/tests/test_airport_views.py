from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from airports.models.airport import Airport
from airports.views.airport_views import (
    AirportLookupView,
    AirportSearchView,
    CalculateDistanceView,
    PopulateAirportsView,
)
from user.models.users import Role, User


class PopulateAirportsViewTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = PopulateAirportsView.as_view()
        system_admin_role = Role.objects.create(role="SYSTEM_ADMIN")
        self.system_admin = User.objects.create_user(
            role=system_admin_role,
            email="admin@example.com",
            password="testpass123",
            firstname="System",
            lastname="Admin",
            is_staff=True,
        )

    def post_populate(self):
        request = self.factory.post("/api/airports/populate/")
        force_authenticate(request, user=self.system_admin)
        return self.view(request)

    @patch("airports.views.airport_views.AirportGapClient")
    def test_populate_airports_success(self, mock_client_class):
        mock_client = mock_client_class.return_value

        mock_client.get_all_airports.return_value = [
            {
                "id": "1",
                "attributes": {
                    "iata": "WAW",
                    "icao": "EPWA",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                    "country": "Poland",
                    "latitude": "52.1657",
                    "longitude": "20.9671",
                    "altitude": 362,
                    "timezone": "Europe/Warsaw",
                },
            },
            {
                "id": "2",
                "attributes": {
                    "iata": "KRK",
                    "icao": "EPKK",
                    "name": "Krakow Airport",
                    "city": "Krakow",
                    "country": "Poland",
                    "latitude": "50.0777",
                    "longitude": "19.7848",
                    "altitude": 791,
                    "timezone": "Europe/Warsaw",
                },
            },
        ]

        response = self.post_populate()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            {
                "success": True,
                "message": (
                    "Successfully populated 2 airports "
                    "into the database."
                ),
            },
        )

        self.assertEqual(
            Airport.objects.filter(iata="WAW").count(),
            1,
        )

        self.assertEqual(
            Airport.objects.filter(iata="KRK").count(),
            1,
        )

        mock_client.get_all_airports.assert_called_once_with()

    @patch("airports.views.airport_views.AirportGapClient")
    def test_populate_airports_skips_airport_without_iata(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_all_airports.return_value = [
            {
                "id": "1",
                "attributes": {
                    "name": "Airport Without IATA",
                    "icao": "TEST",
                },
            },
            {
                "id": "2",
                "attributes": {
                    "iata": "WAW",
                    "icao": "EPWA",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                    "country": "Poland",
                    "latitude": "52.1657",
                    "longitude": "20.9671",
                    "altitude": 362,
                    "timezone": "Europe/Warsaw",
                },
            },
        ]

        response = self.post_populate()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertEqual(
            Airport.objects.count(),
            1,
        )

        self.assertTrue(
            Airport.objects.filter(iata="WAW").exists()
        )

    @patch("airports.views.airport_views.AirportGapClient")
    def test_populate_airports_updates_existing_airport(
        self,
        mock_client_class,
    ):
        Airport.objects.create(
            iata="WAW",
            name="Old Airport Name",
        )

        mock_client = mock_client_class.return_value

        mock_client.get_all_airports.return_value = [
            {
                "id": "1",
                "attributes": {
                    "iata": "WAW",
                    "icao": "EPWA",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                    "country": "Poland",
                    "latitude": "52.1657",
                    "longitude": "20.9671",
                    "altitude": 362,
                    "timezone": "Europe/Warsaw",
                },
            },
        ]

        response = self.post_populate()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            Airport.objects.count(),
            1,
        )

        airport = Airport.objects.get(
            iata="WAW"
        )

        self.assertEqual(
            airport.name,
            "Warsaw Chopin Airport",
        )

        self.assertEqual(
            airport.icao,
            "EPWA",
        )

    @patch("airports.views.airport_views.AirportGapClient")
    def test_populate_airports_returns_500_when_service_fails(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_all_airports.side_effect = Exception(
            "AirportGap API unavailable"
        )

        response = self.post_populate()

        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

        self.assertEqual(
            response.data,
            {
                "success": False,
                "error": "AirportGap API unavailable",
            },
        )


class CalculateDistanceViewTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = CalculateDistanceView.as_view()

    def test_distance_requires_both_airports(self):
        request = self.factory.post(
            "/api/airports/distance/",
            {},
            format="json",
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            response.data,
            {
                "error": "Both airports are required"
            },
        )

    def test_distance_requires_to_airport(self):
        request = self.factory.post(
            "/api/airports/distance/",
            {
                "from": "WAW",
            },
            format="json",
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_distance_requires_from_airport(self):
        request = self.factory.post(
            "/api/airports/distance/",
            {
                "to": "KRK",
            },
            format="json",
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    @patch(
        "airports.views.airport_views."
        "DistanceService.calculate_orthodromic_distance"
    )
    def test_distance_success(self, mock_calculate):
        mock_calculate.return_value = {
            "distance": 293.2,
            "unit": "km",
        }

        request = self.factory.post(
            "/api/airports/distance/",
            {
                "from": "WAW",
                "to": "KRK",
            },
            format="json",
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            {
                "distance": 293.2,
                "unit": "km",
            },
        )

        mock_calculate.assert_called_once_with(
            "WAW",
            "KRK",
        )


class AirportLookupViewTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = AirportLookupView.as_view()

    def test_lookup_returns_airport(self):
        airport = Airport.objects.create(
            iata="WAW",
            icao="EPWA",
            name="Warsaw Chopin Airport",
            city="Warsaw",
            country="Poland",
            latitude=52.1657,
            longitude=20.9671,
            altitude=362,
            timezone="Europe/Warsaw",
        )

        request = self.factory.get(
            "/api/airports/WAW/"
        )

        response = self.view(
            request,
            iata="WAW",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertEqual(
            response.data["data"],
            {
                "iata": "WAW",
                "icao": "EPWA",
                "name": "Warsaw Chopin Airport",
                "city": "Warsaw",
                "country": "Poland",
                "latitude": format(airport.latitude, "f"),
                "longitude": format(airport.longitude, "f"),
                "altitude": airport.altitude,
                "timezone": "Europe/Warsaw",
            },
        )

    def test_lookup_returns_404_when_airport_does_not_exist(self):
        request = self.factory.get(
            "/api/airports/XXX/"
        )

        response = self.view(
            request,
            iata="XXX",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertEqual(
            response.data,
            {
                "success": False,
                "error": "Airport not found",
            },
        )


class AirportSearchViewTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = AirportSearchView.as_view()

        Airport.objects.create(
            iata="WAW",
            icao="EPWA",
            name="Warsaw Chopin Airport",
            city="Warsaw",
            country="Poland",
        )

        Airport.objects.create(
            iata="KRK",
            icao="EPKK",
            name="Krakow Airport",
            city="Krakow",
            country="Poland",
        )

        Airport.objects.create(
            iata="GDN",
            icao="EPGD",
            name="Gdansk Airport",
            city="Gdansk",
            country="Poland",
        )

    def test_search_returns_matching_airports(self):
        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "war",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [
                {
                    "iata": "WAW",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                }
            ],
        )

    def test_search_is_case_insensitive(self):
        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "WAW",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [
                {
                    "iata": "WAW",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                }
            ],
        )

    def test_search_by_city(self):
        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "krak",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [
                {
                    "iata": "KRK",
                    "name": "Krakow Airport",
                    "city": "Krakow",
                }
            ],
        )

    def test_search_by_airport_name(self):
        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "chopin",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [
                {
                    "iata": "WAW",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                }
            ],
        )

    def test_search_with_query_shorter_than_two_characters(self):
        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "w",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [],
        )

    def test_search_with_empty_query(self):
        request = self.factory.get(
            "/api/airports/search/"
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [],
        )

    def test_search_strips_whitespace(self):
        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "  WAW  ",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            [
                {
                    "iata": "WAW",
                    "name": "Warsaw Chopin Airport",
                    "city": "Warsaw",
                }
            ],
        )

    def test_search_returns_maximum_of_ten_results(self):
        for i in range(15):
            Airport.objects.create(
                iata=f"X{i:02d}",
                name=f"Test Airport {i}",
                city="Test City",
                country="Poland",
            )

        request = self.factory.get(
            "/api/airports/search/",
            {
                "q": "test",
            },
        )

        response = self.view(request)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertLessEqual(
            len(response.data),
            10,
        )