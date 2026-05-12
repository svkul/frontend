import { clientFetch } from "@/lib/api/client/utils/bff";

import type { MeResponse } from "@/lib/api/types/auth";

export async function meClient(): Promise<MeResponse> {
  return clientFetch<MeResponse>("/api/auth/me");
}

export async function refreshClient(): Promise<{ ok: true }> {
  return clientFetch<{ ok: true }>(
    "/api/auth/refresh",
    {
      method: "POST",
    },
    { retryOn401: false },
  );
}

export async function logoutClient(): Promise<{ ok: true }> {
  return clientFetch<{ ok: true }>(
    "/api/auth/logout",
    {
      method: "POST",
    },
    { retryOn401: false },
  );
}
