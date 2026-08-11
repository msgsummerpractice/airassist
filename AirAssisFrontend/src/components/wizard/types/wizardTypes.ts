export type DisruptionMotive = "CANCELATION" | "DELAY" | "DENIED_BOARDING" | "";

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
