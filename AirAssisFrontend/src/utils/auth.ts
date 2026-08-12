// JWT is read client-side only for the role claim — no cryptographic verification needed here
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem("airassist_access_token");
}

export function getTokenRole(): string | null {
  const token = getStoredAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return typeof payload?.role === "string" ? payload.role : null;
}

export function isSystemAdmin(): boolean {
  return getTokenRole() === "SYSTEM_ADMIN";
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function tryRefreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("airassist_refresh_token");
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string };
    if (!data.access) return false;
    localStorage.setItem("airassist_access_token", data.access);
    return true;
  } catch {
    return false;
  }
}

/** fetch wrapper that attaches the Bearer token and silently refreshes on 401. */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const makeRequest = () =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${getStoredAccessToken() ?? ""}`,
      },
    });

  let res = await makeRequest();

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await makeRequest();
    } else {
      localStorage.removeItem("airassist_access_token");
      localStorage.removeItem("airassist_refresh_token");
      window.location.href = "/";
    }
  }

  return res;
}
