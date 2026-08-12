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
