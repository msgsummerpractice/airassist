from pathlib import Path
import json

_EU_COUNTRIES_PATH = Path(__file__).resolve().parent / "eu_countries.json"

with open(_EU_COUNTRIES_PATH, encoding="utf-8") as eu_countries_file:
    EU_COUNTRIES = json.load(eu_countries_file)
