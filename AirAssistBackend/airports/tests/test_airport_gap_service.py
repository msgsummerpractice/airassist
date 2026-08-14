from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
from requests.exceptions import HTTPError

from airports.services.airport_gap_service import AirportGapClient


@override_settings(
    AIRPORT_GAP_BASE_URL="https://airportgap.com/api",
    AIRPORT_GAP_API_TOKEN="test-token",
)
class AirportGapClientTests(SimpleTestCase):

    def setUp(self):
        self.client = AirportGapClient()

    def test_init_sets_base_url_and_authorization_header(self):
        self.assertEqual(
            self.client.base_url,
            "https://airportgap.com/api",
        )

        self.assertEqual(
            self.client.headers,
            {
                "Authorization": "Bearer token=test-token",
            },
        )

    @patch("airports.services.airport_gap_service.requests.get")
    def test_get_airport_returns_json(self, mock_get):
        response = Mock()

        response.json.return_value = {
            "data": {
                "id": "123",
                "attributes": {
                    "name": "Warsaw Chopin Airport",
                    "iata": "WAW",
                },
            }
        }

        mock_get.return_value = response

        result = self.client.get_airport("123")

        mock_get.assert_called_once_with(
            "https://airportgap.com/api/airports/123",
            headers=self.client.headers,
        )

        response.raise_for_status.assert_called_once_with()

        self.assertEqual(
            result,
            {
                "data": {
                    "id": "123",
                    "attributes": {
                        "name": "Warsaw Chopin Airport",
                        "iata": "WAW",
                    },
                }
            },
        )

    @patch("airports.services.airport_gap_service.requests.get")
    def test_get_airport_raises_http_error(self, mock_get):
        response = Mock()
        error = HTTPError("404 Not Found")

        response.raise_for_status.side_effect = error
        mock_get.return_value = response

        with self.assertRaises(HTTPError):
            self.client.get_airport("invalid")

        response.raise_for_status.assert_called_once_with()

    @patch("airports.services.airport_gap_service.requests.post")
    def test_get_airport_distance_returns_json(self, mock_post):
        response = Mock()

        response.json.return_value = {
            "data": {
                "attributes": {
                    "kilometers": 519.4,
                },
            },
        }

        mock_post.return_value = response

        result = self.client.get_airport_distance("WAW", "KRK")

        mock_post.assert_called_once_with(
            "https://airportgap.com/api/airports/distance",
            headers=self.client.headers,
            data={
                "from": "WAW",
                "to": "KRK",
            },
        )

        response.raise_for_status.assert_called_once_with()

        self.assertEqual(
            result,
            {
                "data": {
                    "attributes": {
                        "kilometers": 519.4,
                    },
                },
            },
        )

    @patch("airports.services.airport_gap_service.requests.post")
    def test_get_airport_distance_raises_http_error(self, mock_post):
        response = Mock()
        error = HTTPError("Bad request")

        response.raise_for_status.side_effect = error
        mock_post.return_value = response

        with self.assertRaises(HTTPError):
            self.client.get_airport_distance("XXX", "YYY")

        response.raise_for_status.assert_called_once_with()

    @patch("airports.services.airport_gap_service.time.sleep")
    @patch("airports.services.airport_gap_service.requests.get")
    def test_get_all_airports_fetches_multiple_pages(
        self,
        mock_get,
        mock_sleep,
    ):
        first_response = Mock()

        first_response.json.return_value = {
            "data": [
                {
                    "id": "1",
                    "attributes": {
                        "iata": "WAW",
                        "name": "Warsaw Chopin Airport",
                    },
                },
                {
                    "id": "2",
                    "attributes": {
                        "iata": "KRK",
                        "name": "Krakow Airport",
                    },
                },
            ],
            "links": {
                "next": "https://airportgap.com/api/airports?page=2",
            },
        }

        second_response = Mock()

        second_response.json.return_value = {
            "data": [
                {
                    "id": "3",
                    "attributes": {
                        "iata": "GDN",
                        "name": "Gdansk Airport",
                    },
                },
            ],
            "links": {
                "next": None,
            },
        }

        mock_get.side_effect = [
            first_response,
            second_response,
        ]

        result = self.client.get_all_airports()

        self.assertEqual(len(result), 3)

        self.assertEqual(
            result[0]["attributes"]["iata"],
            "WAW",
        )

        self.assertEqual(
            result[1]["attributes"]["iata"],
            "KRK",
        )

        self.assertEqual(
            result[2]["attributes"]["iata"],
            "GDN",
        )

        self.assertEqual(mock_get.call_count, 2)

        mock_get.assert_any_call(
            "https://airportgap.com/api/airports",
            headers=self.client.headers,
            timeout=10,
        )

        mock_get.assert_any_call(
            "https://airportgap.com/api/airports?page=2",
            headers=self.client.headers,
            timeout=10,
        )

        mock_sleep.assert_called_once_with(0.5)

    @patch("airports.services.airport_gap_service.time.sleep")
    @patch("airports.services.airport_gap_service.requests.get")
    def test_get_all_airports_stops_on_rate_limit(
        self,
        mock_get,
        mock_sleep,
    ):
        response = Mock()

        response.status_code = 429

        response.raise_for_status.side_effect = HTTPError(
            "429 Too Many Requests"
        )

        mock_get.return_value = response

        result = self.client.get_all_airports()

        self.assertEqual(result, [])

        mock_get.assert_called_once_with(
            "https://airportgap.com/api/airports",
            headers=self.client.headers,
            timeout=10,
        )

        mock_sleep.assert_not_called()

    @patch("airports.services.airport_gap_service.requests.get")
    def test_get_all_airports_reraises_other_http_errors(
        self,
        mock_get,
    ):
        response = Mock()

        response.status_code = 500

        error = HTTPError("500 Internal Server Error")

        response.raise_for_status.side_effect = error

        mock_get.return_value = response

        with self.assertRaises(HTTPError):
            self.client.get_all_airports()

    @patch("airports.services.airport_gap_service.requests.get")
    def test_get_all_airports_detects_loop(self, mock_get):
        response = Mock()

        response.json.return_value = {
            "data": [
                {
                    "id": "1",
                    "attributes": {
                        "iata": "WAW",
                        "name": "Warsaw Chopin Airport",
                    },
                }
            ],
            "links": {
                "next": "https://airportgap.com/api/airports",
            },
        }

        mock_get.return_value = response

        result = self.client.get_all_airports()

        self.assertEqual(len(result), 1)

        self.assertEqual(
            result[0]["attributes"]["iata"],
            "WAW",
        )

        # The same URL should never be requested twice.
        self.assertEqual(mock_get.call_count, 1)