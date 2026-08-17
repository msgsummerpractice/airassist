import { fetchWithAuth } from "../../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type EmailDeliveryMode = "SMTP" | "SENDGRID_API" | "MICROSOFT_GRAPH";
export type PdfLayout = "STANDARD" | "COMPACT" | "DETAILED";
export type PdfPageSize = "A4" | "LETTER";
export type PdfField =
  | "case_number"
  | "passenger_name"
  | "passenger_email"
  | "flight_number"
  | "route"
  | "departure_date"
  | "delay_minutes"
  | "claim_status"
  | "assigned_colleague"
  | "disruption_type";

export type EmailPreset = {
  delivery_mode: EmailDeliveryMode;
  sender_name: string;
  sender_email: string;
  reply_to_email: string;
  smtp_host: string;
  smtp_port?: number;
  smtp_username: string;
  use_tls: boolean;
  subject_template: string;
  body_template: string;
  footer_text: string;
};

export type PdfPreset = {
  layout: PdfLayout;
  page_size: PdfPageSize;
  include_branding: boolean;
  include_disruption_summary: boolean;
  include_passenger_contact: boolean;
  include_case_timeline: boolean;
  exported_fields: PdfField[];
  footer_text: string;
};

export type SystemOptions = {
  email_preset: EmailPreset;
  pdf_preset: PdfPreset;
};

type SystemOptionsResponse = {
  data?: SystemOptions;
  message?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (!payload || typeof payload !== "object") {
    return `Request failed with status ${status}.`;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;

  const firstValue = Object.values(record)[0];
  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return String(firstValue[0]);
  }

  if (firstValue && typeof firstValue === "object") {
    const nestedValue = Object.values(firstValue as Record<string, unknown>)[0];
    if (Array.isArray(nestedValue) && nestedValue.length > 0) {
      return String(nestedValue[0]);
    }
    if (typeof nestedValue === "string") {
      return nestedValue;
    }
  }

  return `Request failed with status ${status}.`;
}

export async function fetchSystemOptions(): Promise<SystemOptions> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/system-options/`);
  const payload = await readJsonSafely<SystemOptionsResponse>(response);

  if (!response.ok || !payload?.data) {
    throw new Error(extractErrorMessage(payload, response.status));
  }

  return payload.data;
}

export async function saveSystemOptions(
  settings: SystemOptions,
): Promise<SystemOptionsResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/system-options/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
  const payload = await readJsonSafely<SystemOptionsResponse>(response);

  if (!response.ok || !payload?.data) {
    throw new Error(extractErrorMessage(payload, response.status));
  }

  return payload;
}
