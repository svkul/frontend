"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { googleStartClient } from "@/feature/auth/api/client/auth.client";
import { ApiError } from "@/shared/api/client/api-client";
import { Button } from "@/shared/ui/shadcn/button";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_ACTION = "login";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  size?: "normal" | "flexible" | "compact" | "invisible";
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

interface Props {
  returnTo?: string | null;
  initialError?: string | null;
  /** Per-request CSP nonce from middleware (production); forwarded to next/script for Turnstile. */
  cspScriptNonce?: string;
}

export const LoginForm = ({
  returnTo = null,
  initialError = null,
  cspScriptNonce,
}: Props) => {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  // Mount the widget once both the script and the container are ready.
  useEffect(() => {
    if (!scriptReady || !containerRef.current || !siteKey) return;
    if (!window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: TURNSTILE_ACTION,
      appearance: "interaction-only",
      callback: (t) => {
        setToken(t);
        setError(null);
      },
      "error-callback": () => {
        setToken(null);
        setError("turnstile_error");
      },
      "expired-callback": () => setToken(null),
      "timeout-callback": () => setToken(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey]);

  const handleSignIn = useCallback(async () => {
    if (!token) {
      setError("turnstile_pending");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { redirectUrl } = await googleStartClient({
        turnstileToken: token,
        returnTo,
      });
      window.location.replace(redirectUrl);
    } catch (err) {
      setSubmitting(false);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      setToken(null);
      const code =
        err instanceof ApiError && typeof err.body === "object" && err.body !== null
          ? ((err.body as { message?: string }).message ?? `http_${err.status}`)
          : "network_error";
      setError(code);
    }
  }, [token, returnTo]);

  if (!siteKey) {
    return (
      <p className="text-red-500">
        NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        nonce={cspScriptNonce}
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />

      <Button
        type="button"
        onClick={() => void handleSignIn()}
        disabled={submitting || !token}
        className="flex w-full items-center justify-center gap-2"
      >
        <Image src="/google.png" alt="" width={20} height={20} aria-hidden />
        {submitting ? "Redirecting..." : "Continue with Google"}
      </Button>

      {/* Managed/interaction-only widget. Mostly invisible — only renders an
          interactive challenge for suspicious sessions. */}
      <div ref={containerRef} className="min-h-[65px]" />

      {!token && scriptReady ? (
        <p className="text-xs text-muted-foreground">Verifying browser…</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {humanizeError(error)}
        </p>
      ) : null}
    </div>
  );
};

function humanizeError(code: string): string {
  switch (code) {
    case "turnstile_failed":
      return "Bot verification failed. Please try again.";
    case "turnstile_pending":
      return "Please wait while we verify your browser…";
    case "turnstile_error":
      return "Verification widget failed to load. Refresh and try again.";
    case "oauth_failed":
    case "oauth_state_missing":
    case "oauth_state_consumed":
    case "oauth_state_expired":
      return "Sign-in was interrupted. Please start over.";
    case "account_disabled":
      return "This account is disabled. Contact support.";
    case "network_error":
      return "Network error. Please try again.";
    default:
      return `Sign-in failed (${code}).`;
  }
}
