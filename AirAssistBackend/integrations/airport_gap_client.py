## Integrate Air Distance API. Airport Gap in this case

import requests
import certifi
from django.conf import settings

class AirportGapClient:

    def __init__(self):
        self.base_url = settings.AIRPORT_GAP_BASE_URL

        self.headers = {
            "Authorization": f"Bearer token = {settings.AIRPORT_GAP_API_TOKEN}",

        }

    def  get_airport(self,airport_id):

        url = f"{self.base_url}/airports/{airport_id}"

        response = requests.get(url,headers=self.headers,verify=certifi.where())

        response.raise_for_status
        return response.json()
           