import { NextResponse } from "next/server";

// --- CSP (disabled for testing; uncomment block below before production) ---
// import type { NextRequest } from "next/server";
// import { CSP_NONCE_HEADER } from "@/shared/lib/csp-nonce";
//
// const TURNSTILE = "https://challenges.cloudflare.com";
// const CF_INSIGHTS_SCRIPT = "https://static.cloudflareinsights.com";
// const CF_INSIGHTS_CONNECT = "https://cloudflareinsights.com";
// const GOOGLE_ACCOUNTS = "https://accounts.google.com";
// const GOOGLE_PROFILE_IMG = "https://lh3.googleusercontent.com";
//
// function createNonce(): string {
//   const bytes = new Uint8Array(16);
//   crypto.getRandomValues(bytes);
//   let binary = "";
//   for (const b of bytes) binary += String.fromCharCode(b);
//   return btoa(binary);
// }
//
// function isLoginPath(pathname: string): boolean {
//   return pathname === "/login" || pathname.startsWith("/login/");
// }
//
// function buildContentSecurityPolicy(
//   nonce: string,
//   isDev: boolean,
//   pathname: string,
// ): string {
//   const login = isLoginPath(pathname);
//   const scriptSrc =
//     isDev || login
//       ? `'self' 'unsafe-eval' 'unsafe-inline' ${TURNSTILE} ${CF_INSIGHTS_SCRIPT}`
//       : `'self' 'nonce-${nonce}' 'strict-dynamic' ${TURNSTILE} ${CF_INSIGHTS_SCRIPT}`;
//   const styleSrc = `'self' 'unsafe-inline'`;
//   return [
//     "default-src 'self'",
//     `script-src ${scriptSrc}`,
//     `style-src ${styleSrc}`,
//     `img-src 'self' data: blob: ${GOOGLE_PROFILE_IMG}`,
//     "font-src 'self' data:",
//     `connect-src 'self' ${TURNSTILE} ${CF_INSIGHTS_CONNECT}`,
//     `frame-src ${TURNSTILE}`,
//     "worker-src 'self' blob:",
//     "frame-ancestors 'none'",
//     "base-uri 'none'",
//     "object-src 'none'",
//     `form-action 'self' ${GOOGLE_ACCOUNTS}`,
//     "upgrade-insecure-requests",
//   ].join("; ");
// }

export function middleware() {
  // CSP disabled for testing — restore the block below before production.
  return NextResponse.next();

  // const isDev = process.env.NODE_ENV === "development";
  // const nonce = createNonce();
  // const pathname = request.nextUrl.pathname;
  //
  // const requestHeaders = new Headers(request.headers);
  // requestHeaders.set(CSP_NONCE_HEADER, nonce);
  //
  // const response = NextResponse.next({
  //   request: { headers: requestHeaders },
  // });
  //
  // response.headers.set(
  //   "Content-Security-Policy",
  //   buildContentSecurityPolicy(nonce, isDev, pathname),
  // );
  //
  // return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    },
  ],
};
