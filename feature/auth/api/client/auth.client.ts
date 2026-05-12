import { clientFetch } from "@/utils/api/client/bff";

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

export async function protectedClient(): Promise<{ message: string }> {
  return clientFetch<{ message: string }>("/api/auth/protected", {
    method: "POST",
  });
}
