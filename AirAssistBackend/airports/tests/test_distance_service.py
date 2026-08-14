from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from airports.services.distance_service import DistanceService


class DistanceServiceTests(SimpleTestCase):

    @patch("airports.services.distance_service.AirportGapClient")
    def test_calculate_orthodromic_distance(self, mock_client_class):
        mock_client = mock_client_class.return_value

        mock_client.get_airport_distance.return_value = {
            "data": {
                "attributes": {
                    "kilometers": 519.456789,
                }
            }
        }

        result = DistanceService.calculate_orthodromic_distance(
            "WAW",
            "KRK",
        )

        mock_client.get_airport_distance.assert_called_once_with(
            "WAW",
            "KRK",
        )

        self.assertEqual(
            result,
            519.46,
        )

    @patch("airports.services.distance_service.AirportGapClient")
    def test_calculate_orthodromic_distance_rounds_down(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_airport_distance.return_value = {
            "data": {
                "attributes": {
                    "kilometers": 519.451,
                }
            }
        }

        result = DistanceService.calculate_orthodromic_distance(
            "WAW",
            "KRK",
        )

        self.assertEqual(
            result,
            519.45,
        )

    @patch("airports.services.distance_service.AirportGapClient")
    def test_calculate_orthodromic_distance_rounds_up(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_airport_distance.return_value = {
            "data": {
                "attributes": {
                    "kilometers": 519.456,
                }
            }
        }

        result = DistanceService.calculate_orthodromic_distance(
            "WAW",
            "KRK",
        )

        self.assertEqual(
            result,
            519.46,
        )

    @patch("airports.services.distance_service.AirportGapClient")
    def test_calculate_orthodromic_distance_with_integer(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_airport_distance.return_value = {
            "data": {
                "attributes": {
                    "kilometers": 500,
                }
            }
        }

        result = DistanceService.calculate_orthodromic_distance(
            "WAW",
            "KRK",
        )

        self.assertEqual(
            result,
            500,
        )

    @patch("airports.services.distance_service.AirportGapClient")
    def test_calculate_orthodromic_distance_propagates_client_error(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_airport_distance.side_effect = Exception(
            "AirportGap API error"
        )

        with self.assertRaises(Exception) as context:
            DistanceService.calculate_orthodromic_distance(
                "WAW",
                "KRK",
            )

        self.assertEqual(
            str(context.exception),
            "AirportGap API error",
        )

    @patch("airports.services.distance_service.AirportGapClient")
    def test_calculate_orthodromic_distance_invalid_response(
        self,
        mock_client_class,
    ):
        mock_client = mock_client_class.return_value

        mock_client.get_airport_distance.return_value = {
            "data": {}
        }

        with self.assertRaises(KeyError):
            DistanceService.calculate_orthodromic_distance(
                "WAW",
                "KRK",
            )