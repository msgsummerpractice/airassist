from ..constants import EU_COUNTRIES


class EuCountryService:

    @staticmethod
    def is_eu_country(country):
        if not country:
            return False
        normalized = country.strip().lower()
        return any(
            normalized == eu_country.lower() for eu_country in EU_COUNTRIES
        )
