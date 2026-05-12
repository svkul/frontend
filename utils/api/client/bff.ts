type BffClientFetchOptions = Omit<RequestInit, "credentials">;

type ClientFetchOptions = {
  retryOn401?: boolean;
};

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `BFF request failed with status ${status}`);
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

export async function clientFetch<T>(
  path: string,
  init?: BffClientFetchOptions,
  options?: ClientFetchOptions,
): Promise<T> {
  const retryOn401 = options?.retryOn401 ?? true;

  const baseHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  let response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: baseHeaders,
  });

  if (response.status === 401 && retryOn401) {
    const refreshResponse = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (refreshResponse.ok) {
      response = await fetch(path, {
        ...init,
        credentials: "include",
        headers: baseHeaders,
      });
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
