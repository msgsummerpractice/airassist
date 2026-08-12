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
