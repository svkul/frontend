# Аутентифікація на frontend

## Мета

Браузерний застосунок (Next.js) викликає **API напряму** з **`credentials: 'include'`**. HttpOnly cookies **`accessToken`** / **`refreshToken`** виставляє **бекенд** (OAuth callback, refresh, logout). BFF-маршрути **`/api/auth/*`** видалені.

## Базові принципи

- База API: **`NEXT_PUBLIC_BACKEND_URL`** (без завершального `/`), наприклад `https://api.example.com` або `http://localhost:3000` у dev.
- Усі auth-запити з браузера — **`fetch(..., { credentials: 'include' })`**, щоб браузер додавав cookies, призначені для хоста API (за наявності **`Domain`** — і для спільного parent-домену з `app`).
- **`shared/lib/backend-url.ts`** — **`getBackendBaseUrl()`**; падає на старті, якщо **`NEXT_PUBLIC_BACKEND_URL`** не задано.
- **`shared/api/client/api-client.ts`** — **`clientFetch`**: абсолютний URL до API, **`retryOn401`** за замовчуванням **`true`**: при **401** один раз **`POST .../auth/refresh`** з `credentials`, потім повтор оригінального запиту; **`registerUnauthorizedHandler`** для «жорсткого» скидання стану.
- **`feature/auth/api/client/auth.client.ts`** — обгортки refresh / logout / приклад **`POST /auth/protected`**.
- **`storinki/home/api/server/me.ts`** — **`fetchMe()`** для RSC: проброс **`Cookie`** з вхідного запиту Next на **`GET ${BACKEND}/auth/me`**.

## Логін і callback

- Кнопка Google: **`window.location.href = ${getBackendBaseUrl()}/auth/google`** (`feature/auth/ui/google/Google.tsx`).
- Після OAuth Nest робить **`redirect`** на **`{FRONTEND_URL}/auth/callback`** і ставить cookies у відповіді API.
- **`app/auth/callback/page.tsx`**: клієнтський редірект на **`/`** + **`router.refresh()`** для оновлення RSC.

## SSR і cookies

- **`fetchMe()`** бачить лише ті cookies, які браузер надіслав **на Next** у поточному запиті. Якщо cookies **host-only** для API-хоста без спільного **`Domain`**, RSC на домені **`app`** може не отримати сесію (користувач «гість» у шапці), хоча запити з браузера на API з `credentials` працюють.
- У production для **`app.*`** + **`api.*`** задайте на бекенді **`COOKIE_DOMAIN`** (наприклад **`.porych.com`**) згідно з `Docs/auth-solution.md`.

## Обробка 401

- У **`QueryProvider`** зареєстрований handler: best-effort **`POST ${getBackendBaseUrl()}/auth/logout`** з `credentials`, **`queryClient.removeQueries({ queryKey: ["auth", "me"] })`**, **`router.refresh()`**.

## Важливі нюанси

- Не зберігати токени в **`localStorage`** / **`sessionStorage`**.
- Для серверних `fetch` до API використовуйте **`cache: 'no-store'`** там, де потрібен актуальний auth.
