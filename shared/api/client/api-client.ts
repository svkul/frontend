import { getBackendBaseUrl } from "@/shared/lib/backend-url";

type ClientFetchInit = Omit<RequestInit, "credentials">;

type ClientFetchOptions = {
  retryOn401?: boolean;
};

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.status = status;
  }
}

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export function clearUnauthorizedHandler() {
  unauthorizedHandler = null;
}

async function runUnauthorizedHandler() {
  if (!unauthorizedHandler || isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;
  try {
    await unauthorizedHandler();
  } finally {
    isHandlingUnauthorized = false;
  }
}

function toAbsoluteApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getBackendBaseUrl();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function clientFetch<T>(
  path: string,
  init?: ClientFetchInit,
  options?: ClientFetchOptions,
): Promise<T> {
  const retryOn401 = options?.retryOn401 ?? true;

  const url = toAbsoluteApiUrl(path);

  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (init?.body !== undefined && headers["Content-Type"] === undefined) {
    headers["Content-Type"] = "application/json";
  }

  const doFetch = () =>
    fetch(url, {
      ...init,
      credentials: "include",
      headers,
    });

  let response = await doFetch();

  if (response.status === 401 && retryOn401) {
    const refreshResponse = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (refreshResponse.ok) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      await runUnauthorizedHandler();
    }

    throw new ApiError(response.status);
  }

  return (await response.json()) as T;
}
