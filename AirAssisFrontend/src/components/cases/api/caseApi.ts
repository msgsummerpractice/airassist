import { API_BASE_URL } from "../constants";
import type {
  CaseCommentCreateResponse,
  CaseDetails,
  CaseScope,
} from "../types";

export type CaseApiError = Error & {
  status: number;
};

type ErrorPayload = {
  text?: string[];
  detail?: string;
};

const getCasePath = (scope: CaseScope) =>
  scope === "passenger" ? "/api/cases/me" : "/api/cases/colleague";

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
