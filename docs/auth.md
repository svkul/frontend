# Аутентифікація на frontend

## Мета

Цей документ описує, як frontend працює з авторизацією через BFF-шар та cookie-only сесію.

## Базові принципи

- Frontend і backend працюють на різних доменах, тому browser auth-запити йдуть тільки через Next BFF (`/api/auth/*`).
- Браузер звертається до BFF з `credentials: "include"`, щоб передавалися `httpOnly` cookie.
- BFF проксує до backend з заголовком `Authorization: Bearer ...` (access або refresh залежно від endpoint).
- `accessToken` і `refreshToken` зберігаються в `httpOnly` cookie на домені frontend (Next).
- `accessToken`: `httpOnly`, у production також `secure`, `sameSite=strict`, `path=/`, `maxAge=15m`.
- `refreshToken`: `httpOnly`, у production також `secure`, `sameSite=strict`, `path=/api/auth/refresh`, `maxAge=7d`.

Атрибути cookie, які Next виставляє після refresh, узгоджені з тими, що використовує `GET /api/auth/callback` (див. нижче), якщо перший логін теж проходить через цей BFF-маршрут.

## Точки входу

### Логін через Google (backend у цьому репозиторії)

- Клієнт переходить на `GET /api/auth/google` → BFF редіректить на `${NEXT_PUBLIC_BACKEND_URL}/auth/google`.
- Після Google OAuth Nest обробляє `GET /auth/google/callback`: виставляє `accessToken` та `refreshToken` через **`Set-Cookie`** у відповіді й робить **`redirect` на `{FRONTEND_URL}/auth/callback`** — **без токенів у query** (`backend/src/auth/auth.controller.ts`).
- Тобто «передача» токенів після OAuth тут — це cookie в HTTP-відповіді бекенду перед редіректом на frontend, а не параметри URL.

Поки браузер і API на різних хостах, cookie з відповіді бекенду прив’язані до **домену бекенду**. Щоб ті самі токени були доступні на домені Next (для `GET /api/auth/me` тощо), потрібна узгоджена інфраструктура (спільний parent domain / reverse proxy / інший контракт). Це вже поза межами лише frontend-коду.

### Опційний BFF-маршрут `GET /api/auth/callback` (Next)

- Реалізований як окремий сценарій: якщо **щось** редіректить браузер на `https://<next-host>/api/auth/callback?accessToken=...&refreshToken=...`, route читає токени з **query**, записує їх у cookie на домені Next і редіректить на `/auth/callback`.
- Поточний Nest OAuth callback на такий URL з query **не веде** — він ставить cookie на бекенді й веде прямо на `/auth/callback` frontend.

### Сторінка `/auth/callback`

- `app/auth/callback/page.tsx` (client) виконує `router.replace("/")` і `router.refresh()`, щоб оновити серверні компоненти після логіну.

### Хто завантажує користувача

- Глобального `AuthBootstrap` у `layout.tsx` немає.
- Поточний користувач для UI шапки визначається на сервері: async-компонент `Header` викликає `fetchMe()` з `pages/home/api/server/me.ts`.
- `fetchMe()` робить внутрішній запит на `GET /api/auth/me` з пробросом cookie поточного запиту (`cache: "no-store"`). При `401` або іншій помилці повертається `null` (гість).

## BFF endpoint-и

- `GET /api/auth/google` → redirect на backend `GET /auth/google` (база з `NEXT_PUBLIC_BACKEND_URL`).
- `GET /api/auth/callback` → якщо токени передані в **query**, запис cookie на домені Next і redirect на `/auth/callback` (див. вище; OAuth у Nest за замовчуванням цим шляхом не користується).
- `GET /api/auth/me` → backend `GET /auth/me` з `Authorization: Bearer <accessToken>` з cookie.
- `POST /api/auth/refresh` → backend `POST /auth/refresh` з `Authorization: Bearer <refreshToken>` (з cookie); у відповідь оновлює пару cookie `accessToken`/`refreshToken`.
- `POST /api/auth/logout` → за наявності access token викликає backend `POST /auth/logout-all`, потім очищає auth cookie в браузері.
- `POST /api/auth/protected` → приклад захищеного виклику: backend `POST /auth/protected` з `Authorization: Bearer <accessToken>`.

## Централізований refresh і обробка 401

- `clientFetch` у `shared/api/client/bff.ts` за замовчуванням (`retryOn401: true`): при відповіді `401` один раз викликає `POST /api/auth/refresh`, і якщо refresh успішний — повторює початковий запит.
- Якщо після retry запит знову неуспішний і статус `401`, викликається зареєстрований `unauthorizedHandler`.
- У `QueryProvider` handler робить: best-effort `POST /api/auth/logout`, `queryClient.removeQueries({ queryKey: ["auth", "me"] })`, `router.refresh()` — щоб скинути клієнтський кеш (на майбутні `useQuery` з цим ключем) і перерендерити RSC після виходу.

Окремі виклики (наприклад, `logoutClient` / `refreshClient` у `feature/auth/api/client/auth.client.ts`) передають `{ retryOn401: false }`, щоб уникнути циклів під час refresh/logout.

## API-шар у frontend

- `shared/api/client/bff.ts` — універсальний клієнтський `fetch` з retry на 401 та реєстрацією handler для «жорсткого» неавторизованого стану.
- `feature/auth/api/client/auth.client.ts` — обгортки для refresh, logout і прикладу `POST /api/auth/protected`.
- `pages/home/api/server/me.ts` — серверна функція `fetchMe()` для RSC (проксі через BFF `/api/auth/me`).

## Важливі нюанси

- Не викликати backend auth напряму з браузера — тільки через `/api/auth/*` на домені Next.
- Не зберігати токени в `localStorage` / `sessionStorage`.
- Для BFF auth route handlers доречно використовувати `cache: "no-store"` там, де є проксі до backend.
- Після помилки авторизації на клієнті handler очищає query-ключ `["auth", "me"]` і ініціює `router.refresh()`; явного prefetch `GET /api/auth/me` у React Query зараз у дереві компонентів немає — стан користувача в шапці береться з `fetchMe()` у `Header`.
