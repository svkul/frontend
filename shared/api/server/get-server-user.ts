import { cookies } from "next/headers";
import { cache } from "react";

import type { MeResponse } from "@/shared/models/auth/auth";

import { serverFetchJson } from "./backend-proxy";

/**
 * Load the current user inside a Server Component. Forwards the request's
 * Cookie header to the API so __Secure-access is sent to the backend.
 *
 * Cached per-request via React `cache()` so multiple components in the same
 * render pass don't trigger multiple backend round-trips.
 *
 * NOTE: This does NOT attempt refresh-token rotation on 401. Refreshing in an
 * RSC is unsafe (we cannot write cookies back to the browser from an RSC).
 * The client will refresh on its next mutation through the BFF.
 */
export const getServerUser = cache(async (): Promise<MeResponse | null> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) return null;

  return serverFetchJson<MeResponse>("/auth/me", cookieHeader);
});
