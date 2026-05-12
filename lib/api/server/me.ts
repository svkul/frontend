import { cookies, headers } from "next/headers";

import type { MeResponse } from "@/lib/api/types/auth";

/**
 * Server-side user load via BFF GET /api/auth/me (forwards request cookies).
 */
export async function fetchMe(): Promise<MeResponse | null> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return null;
  }

  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const base = `${protocol}://${host}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const response = await fetch(`${base}/api/auth/me`, {
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
