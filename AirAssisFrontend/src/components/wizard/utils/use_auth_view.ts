import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type AppView =
  | "login"
  | "resolving"
  | "colleague-dashboard"
  | "case-entry";

type UserRoleResponse = {
  role?: string;
};

type TokenPayload = {
  user_id?: string | number;
};

const clearTokens = () => {
  localStorage.removeItem("airassist_access_token");
  localStorage.removeItem("airassist_refresh_token");
};

const readUserIdFromToken = (token: string): string | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded)) as TokenPayload;

    if (payload.user_id === undefined || payload.user_id === null) {
      return null;
    }

    return String(payload.user_id);
  } catch {
    return null;
  }
};

export const useAuthView = () => {
  const [view, setView] = useState<AppView>(() => {
    const accessToken = localStorage.getItem("airassist_access_token");
    return accessToken ? "resolving" : "login";
  });
  const [role, setRole] = useState<string | null>(null);

  const resolveView = useCallback(async () => {
    const accessToken = localStorage.getItem("airassist_access_token");

    if (!accessToken) {
      setRole(null);
      setView("login");
      return;
    }

    const userId = readUserIdFromToken(accessToken);

    if (!userId) {
      clearTokens();
      setRole(null);
      setView("login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not resolve user role.");
      }

      const data = (await response.json()) as UserRoleResponse;
      const resolvedRole = typeof data.role === "string" ? data.role : null;

      setRole(resolvedRole);
      setView(data.role === "COLLEAGUE" ? "colleague-dashboard" : "case-entry");
    } catch {
      clearTokens();
      setRole(null);
      setView("login");
    }
  }, []);

  useEffect(() => {
    if (view !== "resolving") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void resolveView();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resolveView, view]);

  const showCaseEntry = useCallback(() => {
    setView("case-entry");
  }, []);

  return {
    view,
    role,
    resolveView,
    showCaseEntry,
  };
};
