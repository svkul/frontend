export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

export type MeResponse = {
  user: AuthUser;
};

/** POST /auth/refresh — tokens are set via Set-Cookie, not JSON body. */
export type RefreshResponse = {
  ok: true;
};

/** POST /auth/logout, POST /auth/logout-all */
export type LogoutResponse = {
  ok: true;
};

/** POST /auth/google/start request body. */
export type GoogleStartRequest = {
  turnstileToken: string;
  returnTo?: string | null;
};

/** POST /auth/google/start response: URL to redirect the browser to (Google). */
export type GoogleStartResponse = {
  redirectUrl: string;
};
