import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CSP_NONCE_HEADER } from "@/shared/lib/csp-nonce";

const TURNSTILE = "https://challenges.cloudflare.com";
const GOOGLE_ACCOUNTS = "https://accounts.google.com";
const GOOGLE_PROFILE_IMG = "https://lh3.googleusercontent.com";

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  // Dev: Next.js HMR / React refresh needs eval and inline scripts.
  // Prod: per-request nonce + strict-dynamic for scripts allowed by the trusted loader.
  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline' ${TURNSTILE}`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' ${TURNSTILE}`;

  // Next.js injects small inline style blocks (fonts, etc.); `'unsafe-inline'` for styles is a common compromise.
  const styleSrc = `'self' 'unsafe-inline'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src 'self' data: blob: ${GOOGLE_PROFILE_IMG}`,
    "font-src 'self' data:",
    `connect-src 'self' ${TURNSTILE}`,
    `frame-src ${TURNSTILE}`,
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce, isDev),
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
