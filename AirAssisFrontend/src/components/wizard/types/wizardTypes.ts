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
