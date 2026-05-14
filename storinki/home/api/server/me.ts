import { cookies } from "next/headers";

import type { MeResponse } from "@/shared/models/auth/auth";
import { getBackendBaseUrl } from "@/shared/lib/backend-url";

/**
 * Server-side user load: forwards browser cookies to GET /auth/me on the API host.
 */
export async function fetchMe(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${getBackendBaseUrl()}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as MeResponse;
}
