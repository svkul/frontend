import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/feature/auth/ui/login-form/LoginForm";
import { CSP_NONCE_HEADER } from "@/shared/lib/csp-nonce";
import { getServerUser } from "@/shared/api/server/get-server-user";

interface PageProps {
  searchParams?: Promise<{
    returnTo?: string | string[];
    error?: string | string[];
  }>;
}

function pickFirst(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// Server-only validation: only same-origin paths are accepted as `returnTo`.
// Absolute URLs and paths starting with `//` are dropped to prevent open redirects.
function sanitizeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/api/")) return null;
  return raw;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const me = await getServerUser();
  const returnTo = sanitizeReturnTo(pickFirst(params.returnTo));

  if (me) {
    redirect(returnTo ?? "/");
  }

  const error = pickFirst(params.error);
  const hdrs = await headers();
  const cspScriptNonce = hdrs.get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border p-6 shadow-sm">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Continue with your Google account
        </p>
      </div>

      <LoginForm
        returnTo={returnTo}
        initialError={error}
        cspScriptNonce={cspScriptNonce}
      />
    </div>
  );
}
