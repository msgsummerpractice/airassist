import { useCallback, useState } from "react";

import { ACCESS_TOKEN_STORAGE_KEY, COMMENT_MAX_LENGTH } from "../constants";
import { createCaseComment, type CaseApiError } from "../api";
import type { CaseScope } from "../types";

type UseCaseCommentOptions = {
  caseId: number | null;
  scope: CaseScope;
  onUnauthorized?: () => void;
  onCommentCreated?: () => Promise<void>;
};

export function useCaseComment({
  caseId,
  scope,
  onUnauthorized,
  onCommentCreated,
}: UseCaseCommentOptions) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const submitComment = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const normalizedText = commentText.trim();

    if (!accessToken) {
      onUnauthorized?.();
      return;
    }

    if (caseId === null) {
      setErrorMessage("Invalid case id.");
      return;
    }

    if (!normalizedText) {
      setErrorMessage("Comment text cannot be empty.");
      return;
    }

    if (normalizedText.length > COMMENT_MAX_LENGTH) {
      setErrorMessage("Comment text cannot exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createCaseComment({
        scope,
        caseId,
        text: normalizedText,
        accessToken,
      });
      setCommentText("");
      setSuccessMessage("Comment added successfully.");
      await onCommentCreated?.();
    } catch (error) {
      const apiError = error as Partial<CaseApiError>;

      if (apiError.status === 401 || apiError.status === 403) {
        onUnauthorized?.();
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Could not add comment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [caseId, commentText, onCommentCreated, onUnauthorized, scope]);

  const clearMessages = useCallback(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  return {
    commentText,
    setCommentText,
    isSubmitting,
    errorMessage,
    successMessage,
    submitComment,
    clearMessages,
  };
}
