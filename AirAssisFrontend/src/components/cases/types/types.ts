export type CaseScope = "passenger" | "colleague" | "admin";

export type FlightDetails = {
  flight_date: string;
  flight_number: string;
  airline: string;
  reservation_number: string;
  departing_airport: string;
  destination_airport: string;
  planned_departure_time: string;
  planned_arrival_time: string;
};

export type PassengerDetails = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
};

export type CaseDocument = {
  id: number;
  document_type: string;
  filename: string;
  uploaded_at: string;
  download_url?: string | null;
};

export type CaseComment = {
  id: number;
  text: string;
  author_email: string;
  author_role: string;
  created_at: string;
};

export type CaseDetails = {
  id: number;
  status: string;
  flight: FlightDetails | null;
  connecting_flights: FlightDetails[];
  passenger: PassengerDetails | null;
  documents: CaseDocument[];
  comments?: CaseComment[];
  created_at: string;
  updated_at: string;
};

export type CaseCommentCreateResponse = CaseComment;
