import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CSP_NONCE_HEADER } from "@/shared/lib/csp-nonce";

const TURNSTILE = "https://challenges.cloudflare.com";
/** Injected by Cloudflare (orange proxy) when Web Analytics / RUM is enabled. */
const CF_INSIGHTS_SCRIPT = "https://static.cloudflareinsights.com";
/** Beacon posts from browser RUM. */
const CF_INSIGHTS_CONNECT = "https://cloudflareinsights.com";
const GOOGLE_ACCOUNTS = "https://accounts.google.com";
const GOOGLE_PROFILE_IMG = "https://lh3.googleusercontent.com";

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

function buildContentSecurityPolicy(
  nonce: string,
  isDev: boolean,
  pathname: string,
): string {
  const login = isLoginPath(pathname);

  // Dev: Next.js HMR / React refresh needs eval and inline scripts.
  // Prod (general): nonce + strict-dynamic for our own scripts.
  // Prod (/login): Cloudflare Turnstile nests srcdoc/iframes that inherit this document's
  // CSP; nonce-only + strict-dynamic blocks their inline bootstrap (browser console:
  // "Executing inline script violates ... script-src 'nonce-...'"). A relaxed script
  // policy on /login only keeps strict CSP elsewhere.
  const scriptSrc =
    isDev || login
      ? `'self' 'unsafe-eval' 'unsafe-inline' ${TURNSTILE} ${CF_INSIGHTS_SCRIPT}`
      : `'self' 'nonce-${nonce}' 'strict-dynamic' ${TURNSTILE} ${CF_INSIGHTS_SCRIPT}`;

  // Next.js injects small inline style blocks (fonts, etc.); `'unsafe-inline'` for styles is a common compromise.
  const styleSrc = `'self' 'unsafe-inline'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src 'self' data: blob: ${GOOGLE_PROFILE_IMG}`,
    "font-src 'self' data:",
    `connect-src 'self' ${TURNSTILE} ${CF_INSIGHTS_CONNECT}`,
    `frame-src ${TURNSTILE}`,
    // Turnstile challenge workers occasionally use blob workers.
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    `form-action 'self' ${GOOGLE_ACCOUNTS}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = createNonce();
  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce, isDev, pathname),
  );

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    },
  ],
};
