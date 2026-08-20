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

const USER_NAME_STORAGE_KEY = "airassist_user_name";
const USER_EMAIL_STORAGE_KEY = "airassist_user_email";

export function getTokenRole(): string | null {
  const token = getStoredAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return typeof payload?.role === "string" ? payload.role : null;
}

export function setStoredUserIdentity(identity: {
  name?: string | null;
  email?: string | null;
}) {
  if (identity.name) {
    localStorage.setItem(USER_NAME_STORAGE_KEY, identity.name);
  }

  if (identity.email) {
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, identity.email);
  }
}

export function clearStoredUserIdentity() {
  localStorage.removeItem(USER_NAME_STORAGE_KEY);
  localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
}

export function logoutToGuestCaseEntry() {
  localStorage.removeItem("airassist_access_token");
  localStorage.removeItem("airassist_refresh_token");
  clearStoredUserIdentity();
  window.location.assign("/case-entry");
}

const formatNameFromEmail = (email: string) => {
  const prefix = email.split("@")[0] ?? "";
  const parts = prefix
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "Passenger";
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export function getStoredUserIdentity() {
  const accessToken = getStoredAccessToken();
  const role = getTokenRole();

  if (!accessToken) {
    return {
      name: "Guest",
      email: "Not logged in",
      roleLabel: "Guest User",
      isGuest: true,
    };
  }

  const storedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
  const storedEmail = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
  const fallbackName = storedEmail
    ? formatNameFromEmail(storedEmail)
    :role ==="SYSTEM_ADMIN"
     ? "Admin"
     : role === "COLLEAGUE"
      ? "Colleague"
      : "Passenger";

  return {
    name: storedName || fallbackName,
    email: storedEmail || "Email unavailable",
    roleLabel:
  role === "SYSTEM_ADMIN"
    ? "System Administrator"
    : role === "COLLEAGUE"
      ? "Colleague"
      : "Passenger",
    isGuest: false,
  };
}

export function isSystemAdmin(): boolean {
  return getTokenRole() === "SYSTEM_ADMIN";
}

export function getHomeRouteForCurrentUser(): string {
  const role = getTokenRole();
  if (role === "SYSTEM_ADMIN") return "/admin/users";
  if (role === "COLLEAGUE") return "/colleague-dashboard";
  if (role === "PASSENGER") return "/passenger-cases";
  return "/case-entry";
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
      clearStoredUserIdentity();
      window.location.href = "/";
    }
  }

  return res;
}
