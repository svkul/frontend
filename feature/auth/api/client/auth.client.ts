import { clientFetch } from "@/shared/api/client/api-client";

export async function refreshClient(): Promise<{ ok: true }> {
  await clientFetch<{ accessToken: string; refreshToken: string }>(
    "/auth/refresh",
    {
      method: "POST",
    },
    { retryOn401: false },
  );
  return { ok: true };
}

export async function logoutClient(): Promise<{ ok: true }> {
  return clientFetch<{ ok: true }>(
    "/auth/logout",
    {
      method: "POST",
    },
    { retryOn401: false },
  );
}

export async function protectedClient(): Promise<{ message: string }> {
  return clientFetch<{ message: string }>("/auth/protected", {
    method: "POST",
  });
}
