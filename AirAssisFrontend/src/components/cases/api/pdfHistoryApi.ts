import { API_BASE_URL } from "../constants";
import { fetchWithAuth } from "../../../utils/auth";

export type PdfHistoryItem = {
  id: number;
  document_name: string;
  passenger_name: string | null;
  case_id: number;
  document_type: string;
  uploaded_at: string;
};

export type PdfHistoryFilters = {
  caseId?: string;
  documentType?: string;
  passengerName?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
};

type PdfHistoryResponse = {
  success: boolean;
  data: PdfHistoryItem[];
  pagination: { count: number; page: number; page_size: number; num_pages: number };
};

export const fetchPdfHistory = async (
  filters: PdfHistoryFilters,
  page: number,
  pageSize: number,
): Promise<PdfHistoryResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.caseId) params.set("case_id", filters.caseId);
  if (filters.documentType) params.set("document_type", filters.documentType);
  if (filters.passengerName) params.set("passenger_name", filters.passengerName);
  if (filters.uploadedFrom) params.set("uploaded_from", filters.uploadedFrom);
  if (filters.uploadedTo) params.set("uploaded_to", filters.uploadedTo);

  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/cases/documents/?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Could not load PDF history.");
  }

  return (await response.json()) as PdfHistoryResponse;
};

export const downloadPdfHistoryDocument = async (documentId: number, fileName: string) => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/cases/documents/${documentId}/download/`,
  );

  if (!response.ok) {
    throw new Error("Could not download document.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};