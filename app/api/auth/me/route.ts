import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/shared/api/server/backend-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, { backendPath: "/auth/me" });
}
