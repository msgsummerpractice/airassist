const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type CommentValidationErrorPayload = {
  text?: string[];
  detail?: string;
};

export type PassengerCaseCommentApiError = Error & {
  status: number;
};

export type PassengerCaseCommentCreateResponse = {
  id: number;
  text: string;
  author_email: string;
  author_role: string;
  created_at: string;
};

const toApiError = (
  status: number,
  message: string,
): PassengerCaseCommentApiError => {
  const error = new Error(message) as PassengerCaseCommentApiError;
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

export const createPassengerCaseComment = async ({
  caseId,
  text,
  accessToken,
  apiBaseUrl = DEFAULT_API_BASE_URL,
}: {
  caseId: number;
  text: string;
  accessToken: string;
  apiBaseUrl?: string;
}): Promise<PassengerCaseCommentCreateResponse> => {
  const response = await fetch(
    `${apiBaseUrl}/api/cases/me/${caseId}/comments/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text }),
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw toApiError(response.status, "Unauthorized.");
  }

  if (!response.ok) {
    const payload =
      await readJsonSafely<CommentValidationErrorPayload>(response);
    const validationMessage = payload?.text?.[0];
    const detailMessage = payload?.detail;
    throw toApiError(
      response.status,
      validationMessage || detailMessage || "Could not add comment.",
    );
  }

  const payload =
    await readJsonSafely<PassengerCaseCommentCreateResponse>(response);
  if (!payload) {
    throw toApiError(
      response.status,
      "Could not read created comment response.",
    );
  }

  return payload;
};
