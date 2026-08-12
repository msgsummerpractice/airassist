export interface PassengerData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  email: string;
  phone: string;
  address: string;
  postalCode: string;
}

export const EMPTY_PASSENGER: PassengerData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
};

export type PassengerFieldErrors = Partial<Record<keyof PassengerData, string>>;

export interface GDPRData {
  email: string;
  gdprConsent: boolean;
}

export const EMPTY_GDPR: GDPRData = {
  email: "",
  gdprConsent: false,
};

export interface DocumentUploadData {
  boardingPass: File | null;
  identityDocument: File | null;
}

export const EMPTY_DOCUMENT_UPLOAD: DocumentUploadData = {
  boardingPass: null,
  identityDocument: null,
};

export type DocumentUploadField = keyof DocumentUploadData;
export type DocumentUploadErrors = Partial<Record<DocumentUploadField, string>>;
export type DisruptionMotive = "CANCELATION" | "DELAY" | "DENIED_BOARDING" | "";
import type { AirportOption } from "../steps/FlightItineraryStep/AirportAutoComplete";
import type { Dayjs } from "dayjs";

export interface Leg {
  departureAirport: string;
  departureIata: string;
  arrivalAirport: string;
  arrivalIata: string;
  flightDate: Dayjs | null;
  plannedDepartureTime: Dayjs | null;
  plannedArrivalTime: Dayjs | null;
  flightNumber: string;
  airline: string;
  reservationNumber: string;
  nextDayArrival: boolean;
}

export interface DisruptionFormData {
  motive: DisruptionMotive;
  cancellation_type: string;
  delay_type: string;
  denied_boarding_type: string;
  denied_boarding_reason: string;
  airline_motive_mentioned: string;
  airline_motive: string;
  incident_description: string;
}

export interface Itinerary {
  departingAirport: AirportOption | null;
  destinationAirport: AirportOption | null;
  flightType: "direct" | "connecting";
  connections: (AirportOption | null)[];
  disruptedLeg: number | null;
}

export function buildLegs(itinerary: Itinerary): Leg[] {
  const stops =
    itinerary.flightType === "direct"
      ? [itinerary.departingAirport, itinerary.destinationAirport]
      : [
          itinerary.departingAirport,
          ...itinerary.connections,
          itinerary.destinationAirport,
        ];
  const legs: Leg[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    if (!from || !to) continue;
    legs.push({
      departureAirport: from.name,
      departureIata: from.iata,
      arrivalAirport: to.name,
      arrivalIata: to.iata,
      flightDate: null,
      plannedDepartureTime: null,
      plannedArrivalTime: null,
      flightNumber: "",
      airline: "",
      reservationNumber: "",
      nextDayArrival: false,
    });
  }
  return legs;
}
