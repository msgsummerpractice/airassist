const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type CreateColleagueCaseCommentParams = {
  caseId: number;
  text: string;
  accessToken: string;
};

type ColleagueCaseCommentApiError = Error & {
  status?: number;
};

const buildApiError = (message: string, status?: number) => {
  const error = new Error(message) as ColleagueCaseCommentApiError;
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

const createColleagueCaseComment = async ({
  caseId,
  text,
  accessToken,
}: CreateColleagueCaseCommentParams) => {
  const response = await fetch(
    `${API_BASE_URL}/api/cases/colleague/${caseId}/comments/`,
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

export { createColleagueCaseComment };
export type { ColleagueCaseCommentApiError };