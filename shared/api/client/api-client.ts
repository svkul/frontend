type ClientFetchInit = Omit<RequestInit, "credentials">;

type ClientFetchOptions = {
  /** Try refresh-rotation once on 401, then retry the original request. */
  retryOn401?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message?: string, body?: unknown) {
    super(message ?? `API request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

const CSRF_COOKIE = "__Secure-csrf";
const CSRF_HEADER = "X-CSRF-Token";
const REFRESH_PATH = "/api/auth/refresh";
const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return trimmed.slice(target.length);
  }
  return null;
}

/**
 * Coalesce concurrent refresh attempts: a burst of 401s should issue exactly
 * one /api/auth/refresh call and wait for its result.
 */
let pendingRefresh: Promise<boolean> | null = null;
async function refreshOnce(): Promise<boolean> {
  if (pendingRefresh) return pendingRefresh;
  pendingRefresh = (async () => {
    try {
      const res = await fetch(REFRESH_PATH, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders("POST"),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      pendingRefresh = null;
    }
  })();
  return pendingRefresh;
}

function csrfHeaders(method: string): HeadersInit {
  if (!STATE_CHANGING.has(method.toUpperCase())) return {};
  const token = readCookie(CSRF_COOKIE);
  return token ? { [CSRF_HEADER]: token } : {};
}

/**
 * Browser-side fetch for our own `/api/*` BFF endpoints. Adds:
 *  - `credentials: include` (cookies travel on same-origin too — explicit is safer)
 *  - X-CSRF-Token header on state-changing methods (double-submit pattern)
 *  - Optional one-shot retry on 401 via /api/auth/refresh
 *
 * Path must be a same-origin relative URL (e.g. `/api/auth/logout`). Absolute
 * URLs to the backend are intentionally NOT supported here — those should
 * only ever be reachable through Route Handlers.
 */
export async function clientFetch<T>(
  path: string,
  init?: ClientFetchInit,
  options?: ClientFetchOptions,
): Promise<T> {
  if (/^https?:\/\//i.test(path)) {
    throw new Error(
      `clientFetch only accepts relative URLs, got "${path}". Use BFF route handlers under /api/*.`,
    );
  }

  const retryOn401 = options?.retryOn401 ?? true;
  const method = (init?.method ?? "GET").toUpperCase();

  const doFetch = () =>
    fetch(path, {
      ...init,
      method,
      credentials: "include",
      headers: {
        ...csrfHeaders(method),
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

  let response = await doFetch();

  if (response.status === 401 && retryOn401 && path !== REFRESH_PATH) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(response.status, undefined, body);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
