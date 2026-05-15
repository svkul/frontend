import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-only URL of the NestJS API. Throws at first call when missing so
 * misconfiguration fails fast on cold boot instead of on a user request.
 */
function getBackendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error("BACKEND_URL env is not configured");
  }
  return url.replace(/\/+$/, "");
}

/**
 * Canonical web origin (e.g. https://porych.com). Sent as `Origin` to the
 * backend so its CsrfGuard sees a trusted origin on state-changing requests.
 */
function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) {
    throw new Error("NEXT_PUBLIC_APP_URL env is not configured");
  }
  return origin.replace(/\/+$/, "");
}

// Hop-by-hop or framework-managed headers we must never forward verbatim.
const HOP_BY_HOP_RESPONSE = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
  "content-encoding",
  "content-length",
]);

const SAFE_FORWARD_REQUEST_HEADERS = [
  "user-agent",
  "accept",
  "accept-language",
  "cf-connecting-ip",
  "cf-ray",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-request-id",
  /** Double-submit CSRF: browser sends token; Nest CsrfGuard compares to cookie. */
  "x-csrf-token",
];

export interface ProxyOptions {
  /** Backend path starting with `/`, e.g. `/auth/refresh`. */
  backendPath: string;
  /** Extra headers added to the upstream request (e.g. X-CSRF-Token). */
  extraHeaders?: Record<string, string>;
  /** Override the body that goes upstream. Default: pass-through. */
  body?: BodyInit | null;
}

/**
 * Forward an incoming Next.js request to the NestJS API and stream the response
 * back to the browser. Cookies are forwarded both ways. The browser only ever
 * sees the Next.js origin — the API host stays hidden behind the BFF.
 */
export async function proxyToBackend(
  req: NextRequest,
  options: ProxyOptions,
): Promise<NextResponse> {
  const backendUrl = `${getBackendUrl()}${options.backendPath}`;

  const upstreamHeaders = new Headers();
  // Pass through specific, low-risk headers the backend needs for audit + rate
  // limiting decisions. We intentionally do NOT forward `host`, `origin`, etc.
  for (const name of SAFE_FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) upstreamHeaders.set(name, value);
  }

  // Cookie header carries the auth/CSRF cookies. Pass it verbatim — the
  // backend reads __Secure-access / __Secure-refresh / __Secure-csrf from it.
  const cookie = req.headers.get("cookie");
  if (cookie) upstreamHeaders.set("cookie", cookie);

  // Tell the backend the request originated from our canonical web origin so
  // the CsrfGuard's Origin check passes. Without this, server→server fetch
  // sends no Origin header by default.
  upstreamHeaders.set("origin", getAppOrigin());

  // Preserve content-type for POST/PUT/PATCH bodies.
  const contentType = req.headers.get("content-type");
  if (contentType) upstreamHeaders.set("content-type", contentType);

  for (const [k, v] of Object.entries(options.extraHeaders ?? {})) {
    upstreamHeaders.set(k, v);
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstreamBody =
    options.body !== undefined
      ? options.body
      : hasBody
        ? await req.arrayBuffer()
        : undefined;

  const upstreamResponse = await fetch(backendUrl, {
    method,
    headers: upstreamHeaders,
    body: upstreamBody as BodyInit | null | undefined,
    // We MUST NOT auto-follow 302s — the OAuth callback redirect carries
    // Set-Cookie headers that the browser must see in the final response.
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  // Multiple Set-Cookie headers must be preserved individually. Headers#getSetCookie
  // is the spec-compliant way to read them in Node 20+ / undici.
  const setCookies = upstreamResponse.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) {
    responseHeaders.append("set-cookie", c);
  }
  upstreamResponse.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (lower === "set-cookie") return;
    if (HOP_BY_HOP_RESPONSE.has(lower)) return;
    responseHeaders.set(lower, value);
  });

  // Don't pipe a body for empty responses (204/304) — undici will throw.
  const status = upstreamResponse.status;
  const bodyless = status === 204 || status === 304;

  return new NextResponse(bodyless ? null : upstreamResponse.body, {
    status,
    headers: responseHeaders,
  });
}

/**
 * Server-side fetch for Server Components: read-only `GET` to the backend with
 * forwarded cookies. Returns parsed JSON or null on 401/403/non-2xx.
 *
 * For mutations from RSC use a Route Handler + a client-initiated request
 * instead — RSC should not perform side effects.
 */
export async function serverFetchJson<T>(
  backendPath: string,
  cookieHeader: string | null,
): Promise<T | null> {
  const upstreamHeaders = new Headers();
  if (cookieHeader) upstreamHeaders.set("cookie", cookieHeader);
  upstreamHeaders.set("origin", getAppOrigin());
  upstreamHeaders.set("accept", "application/json");

  const response = await fetch(`${getBackendUrl()}${backendPath}`, {
    method: "GET",
    headers: upstreamHeaders,
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}
