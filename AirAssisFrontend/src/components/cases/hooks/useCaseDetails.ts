import { useCallback, useEffect, useState } from "react";

import { ACCESS_TOKEN_STORAGE_KEY } from "../constants";
import { fetchCaseDetails, type CaseApiError } from "../api";
import type { CaseDetails, CaseScope } from "../types";

type UseCaseDetailsOptions = {
  caseId: number | null;
  scope: CaseScope;
  onUnauthorized?: () => void;
};

export function useCaseDetails({
  caseId,
  scope,
  onUnauthorized,
}: UseCaseDetailsOptions) {
  const [details, setDetails] = useState<CaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const reload = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      onUnauthorized?.();
      return;
    }

    if (caseId === null) {
      setDetails(null);
      setErrorMessage("Invalid case id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await fetchCaseDetails({
        scope,
        caseId,
        accessToken,
      });
      setDetails(payload);
    } catch (error) {
      const apiError = error as Partial<CaseApiError>;

      if (apiError.status === 401 || apiError.status === 403) {
        onUnauthorized?.();
        return;
      }

      setDetails(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load case details.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [caseId, onUnauthorized, scope]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [reload]);

  return { details, isLoading, errorMessage, reload };
}
