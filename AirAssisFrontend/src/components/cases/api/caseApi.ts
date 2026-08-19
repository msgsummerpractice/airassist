import { API_BASE_URL } from "../constants";
import { fetchWithAuth } from "../../../utils/auth";
import type {
  CaseCommentCreateResponse,
  CaseDetails,
  CaseDocument,
  CaseScope,
} from "../types";

export type CaseApiError = Error & {
  status: number;
};

type ErrorPayload = {
  file?: string[];
  document_type?: string[];
  text?: string[];
  detail?: string;
  message?: string;
};

export type CaseDocumentUploadResponse = CaseDocument & {
  message?: string;
};

export type ConversationActionResponse = {
  message: string;
  conversation_status: "OPEN" | "CLOSED";
};

const getCasePath = (scope: CaseScope) =>
  scope === "passenger"
    ? "/api/cases/me"
    : scope === "colleague"
      ? "/api/cases/colleague"
      : "/api/cases/admin";

const toApiError = (status: number, message: string): CaseApiError => {
  const error = new Error(message) as CaseApiError;
  error.status = status;
  return error;
};

const readJsonSafely = async <T>(response: Response): Promise<T | null> => {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
};

const throwForUnauthorized = (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    throw toApiError(response.status, "Unauthorized.");
  }
};

export const fetchCaseDetails = async ({
  scope,
  caseId,
  accessToken,
}: {
  scope: CaseScope;
  caseId: number;
  accessToken: string;
}): Promise<CaseDetails> => {
  const response = await fetch(
    `${API_BASE_URL}${getCasePath(scope)}/${caseId}/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const responseText = await response.text();
    throw toApiError(
      response.status,
      responseText || "Could not load case details.",
    );
  }

  return (await response.json()) as CaseDetails;
};

export const createCaseComment = async ({
  scope,
  caseId,
  text,
  accessToken,
}: {
  scope: CaseScope;
  caseId: number;
  text: string;
  accessToken: string;
}): Promise<CaseCommentCreateResponse> => {
  const response = await fetch(
    `${API_BASE_URL}${getCasePath(scope)}/${caseId}/comments/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text }),
    },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.text?.[0] || payload?.detail || "Could not add comment.",
    );
  }

  const payload = await readJsonSafely<CaseCommentCreateResponse>(response);

  if (!payload) {
    throw toApiError(
      response.status,
      "Could not read created comment response.",
    );
  }

  return payload;
};

export const uploadCaseDocument = async ({
  scope = "colleague",
  caseId,
  file,
  documentType,
  accessToken,
}: {
  scope?: CaseScope;
  caseId: number;
  file: File;
  documentType: string;
  accessToken: string;
}): Promise<CaseDocumentUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const response = await fetch(
    `${API_BASE_URL}${getCasePath(scope)}/${caseId}/documents/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.file?.[0] ||
        payload?.document_type?.[0] ||
        payload?.detail ||
        "Could not upload document.",
    );
  }

  const payload = await readJsonSafely<CaseDocumentUploadResponse>(response);

  if (!payload) {
    throw toApiError(
      response.status,
      "Could not read uploaded document response.",
    );
  }

  return payload;
};

export const downloadCaseDocument = async ({
  scope = "colleague",
  caseId,
  documentId,
  accessToken,
}: {
  scope?: CaseScope;
  caseId: number;
  documentId: number;
  accessToken: string;
}): Promise<Response> => {
  const response = await fetch(
    `${API_BASE_URL}${getCasePath(scope)}/${caseId}/documents/${documentId}/download/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.detail || "Could not download document.",
    );
  }

  return response;
};

export const deleteCaseDocument = async ({
  scope = "colleague",
  caseId,
  documentId,
  accessToken,
}: {
  scope?: CaseScope;
  caseId: number;
  documentId: number;
  accessToken: string;
}): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}${getCasePath(scope)}/${caseId}/documents/${documentId}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.detail || "Could not delete document.",
    );
  }
};

const updateCaseConversation = async ({
  caseId,
  action,
  accessToken,
}: {
  caseId: number;
  action: "close" | "reopen";
  accessToken: string;
}): Promise<ConversationActionResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/colleague/${caseId}/conversation/${action}/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.detail || "Could not update conversation.",
    );
  }

  const payload = await readJsonSafely<ConversationActionResponse>(response);
  if (!payload) {
    throw toApiError(response.status, "Could not read conversation response.");
  }

  return payload;
};

export const closeCaseConversation = async ({
  caseId,
  accessToken,
}: {
  caseId: number;
  accessToken: string;
}) => updateCaseConversation({ caseId, accessToken, action: "close" });

export const reopenCaseConversation = async ({
  caseId,
  accessToken,
}: {
  caseId: number;
  accessToken: string;
}) => updateCaseConversation({ caseId, accessToken, action: "reopen" });

export type AdminCaseListItem = {
  id: number;
  case_date: string;
  flight_number: string | null;
  flight_date: string | null;
  status: string;
};

type AdminCaseListResponse = {
  success: boolean;
  data: AdminCaseListItem[];
};

export const fetchAdminCases = async (): Promise<AdminCaseListItem[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/cases/admin/`);

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.message || "Could not load cases.",
    );
  }

  const payload = await readJsonSafely<AdminCaseListResponse>(response);

  if (!payload?.success || !Array.isArray(payload.data)) {
    throw toApiError(response.status, "Could not read case list response.");
  }

  return payload.data;
};

export const deleteAdminCase = async (caseId: number): Promise<void> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/cases/admin/${caseId}/`,
    { method: "DELETE" },
  );

  throwForUnauthorized(response);

  if (!response.ok) {
    const payload = await readJsonSafely<ErrorPayload>(response);
    throw toApiError(
      response.status,
      payload?.message || payload?.detail || "Could not delete case.",
    );
  }
};
