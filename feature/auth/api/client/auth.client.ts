import { clientFetch } from "@/shared/api/client/api-client";
import type {
  GoogleStartRequest,
  GoogleStartResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
} from "@/shared/models/auth/auth";

/**
 * Start OAuth flow. Sends Turnstile token to BFF, which forwards to backend
 * for server-side verification. Returns the Google authorization URL — the
 * caller is responsible for navigating the browser to it.
 *
 * Anonymous endpoint: no auth cookies/CSRF expected.
 */
export async function googleStartClient(
  payload: GoogleStartRequest,
): Promise<GoogleStartResponse> {
  return clientFetch<GoogleStartResponse>(
    "/api/auth/google/start",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
    { retryOn401: false },
  );
}

export async function refreshClient(): Promise<RefreshResponse> {
  return clientFetch<RefreshResponse>(
    "/api/auth/refresh",
    { method: "POST" },
    { retryOn401: false },
  );
}

export async function logoutClient(): Promise<LogoutResponse> {
  return clientFetch<LogoutResponse>(
    "/api/auth/logout",
    { method: "POST" },
    { retryOn401: false },
  );
}

export async function logoutAllClient(): Promise<LogoutResponse> {
  return clientFetch<LogoutResponse>(
    "/api/auth/logout-all",
    { method: "POST" },
    { retryOn401: false },
  );
}

export async function meClient(): Promise<MeResponse> {
  return clientFetch<MeResponse>("/api/auth/me");
}
