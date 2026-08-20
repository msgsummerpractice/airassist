import euCountries from "./euCountries.json";

export const EU_COUNTRIES: string[] = euCountries;

export function isEuCountry(country?: string | null): boolean {
  if (!country) {
    return false;
  }
  return EU_COUNTRIES.some(
    (euCountry) => euCountry.toLowerCase() === country.trim().toLowerCase(),
  );
}
