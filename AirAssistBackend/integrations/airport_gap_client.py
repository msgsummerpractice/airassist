import requests
import time
from django.conf import settings
from requests.exceptions import HTTPError

class AirportGapClient:
    def __init__(self):
        self.base_url = settings.AIRPORT_GAP_BASE_URL
        self.headers = {
            "Authorization": f"Bearer token={settings.AIRPORT_GAP_API_TOKEN}",
        }

    def get_airport(self, airport_id):
        url = f"{self.base_url}/airports/{airport_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_all_airports(self): 
        url = f"{self.base_url}/airports"
        all_airports = []
        pages_fetched = 0
        visited_urls = set()
        while url:
            if url in visited_urls:
                print(f"API Loop detected at page {pages_fetched}! Stopping safely.")
                break
            visited_urls.add(url)
            print(f"Fetching page {pages_fetched + 1}... ({url})")
            
            try:
                response = requests.get(url, headers=self.headers, timeout=10)
                response.raise_for_status()
            except HTTPError as e:
                if response.status_code == 429:
                    print("Rate limit hit. Stopping early.")
                    break
                raise e
            
            data = response.json()
            all_airports.extend(data.get('data', []))
            
            url = data.get('links', {}).get('next')
            pages_fetched += 1
            
            if url:
                time.sleep(0.5) 
            
        return all_airports