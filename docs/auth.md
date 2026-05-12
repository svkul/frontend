# Аутентифікація на frontend

## Мета

Цей документ описує, як frontend працює з авторизацією через BFF-шар та cookie-only сесію.

## Базові принципи

- Frontend і backend працюють на різних доменах, тому browser auth-запити йдуть тільки через Next BFF (`/api/auth/*`).
- Browser спілкується тільки з BFF (`/api/auth/*`) через cookie.
- BFF спілкується з backend через `Authorization: Bearer ...`.
- `accessToken` і `refreshToken` зберігаються в `httpOnly` cookie на frontend домені.
- `accessToken` cookie: `httpOnly`, `secure`, `sameSite=lax`, `path=/`, `maxAge=15m`.
- `refreshToken` cookie: `httpOnly`, `secure`, `sameSite=strict`, `path=/api/auth/refresh`, `maxAge=7d`.

## Точки входу

### Логін через Google

- Кнопка логіну веде на `GET /api/auth/google`.
- Після успішного OAuth backend редіректить на `GET /api/auth/callback` з токенами.

### Callback сторінка

- `GET /api/auth/callback` встановлює `accessToken`/`refreshToken` cookie і редіректить на `/auth/callback`.
- `app/auth/callback/page.tsx` лише редіректить на `/`.
- Ініціалізація юзера виконується глобально в `app/layout.tsx` через `AuthBootstrap` -> `GET /api/auth/me`.

## BFF endpoint-и

- `GET /api/auth/google` -> redirect на backend `GET /auth/google`.
- `GET /api/auth/callback` -> встановлення auth cookie на frontend домені.
- `GET /api/auth/me` -> backend `GET /auth/me` через `Authorization: Bearer <accessToken>`.
- `POST /api/auth/refresh` -> проксі на backend `POST /auth/refresh`.
- `POST /api/auth/logout` -> backend `POST /auth/logout-all` через access token + очистка auth cookie.

## Централізований refresh/retry flow

- `AuthBootstrap` викликає `GET /api/auth/me` один раз і записує `user` в query cache (`["auth", "me"]`).
- Клієнтський `clientFetch` має централізований retry:
  - якщо запит отримав `401`, викликається `POST /api/auth/refresh`;
  - після успішного refresh виконується один retry початкового запиту.

## API-шар у frontend

- `lib/api/server/*` — серверні запити.
- `lib/api/client/*` — клієнтські запити.
- `lib/api/server/utils/*` — server utilities.
- `lib/api/client/utils/*` — client utilities.
- Назви методів мають містити `Server` або `Client`.

## Важливі нюанси

- Не виконувати direct browser calls на backend auth endpoints, тільки через `/api/auth/*`.
- Не зберігати auth токени в JS storage (`localStorage`/`sessionStorage`).
- Усі BFF auth endpoints повинні працювати з `cache: "no-store"`.
- Після logout очищати auth query cache (`["auth", "me"]`) і auth cookie.
