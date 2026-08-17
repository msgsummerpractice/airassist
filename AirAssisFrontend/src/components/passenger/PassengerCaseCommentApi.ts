const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type CreatePassengerCaseCommentParams = {
  caseId: number;
  text: string;
  accessToken: string;
};

type PassengerCaseCommentApiError = Error & {
  status?: number;
};

const buildApiError = (message: string, status?: number) => {
  const error = new Error(message) as PassengerCaseCommentApiError;
  error.status = status;
  return error;
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { detail?: string; text?: string };

    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.text === "string" && payload.text.trim()) {
      return payload.text;
    }
  } catch {
    const responseText = await response.text().catch(() => "");
    if (responseText.trim()) {
      return responseText;
    }
  }

  return "Could not add comment.";
};

const createPassengerCaseComment = async ({
  caseId,
  text,
  accessToken,
}: CreatePassengerCaseCommentParams) => {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/me/${caseId}/comments/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    throw buildApiError(await readErrorMessage(response), response.status);
  }

  return response.json();
};

export { createPassengerCaseComment };
export type { PassengerCaseCommentApiError };