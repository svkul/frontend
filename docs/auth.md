# Аутентифікація на frontend

Описує роль Next.js як **BFF** (Backend-for-Frontend): браузер спілкується лише з origin застосунку; URL NestJS API залишається серверним секретом.

## Змінні середовища (орієнтир)

Див. `frontend/.env.example`:

- **`BACKEND_URL`** — повний базовий URL NestJS **без** префікса `NEXT_PUBLIC_`; використовують лише Route Handlers і серверний код.
- **`NEXT_PUBLIC_APP_URL`** — канонічний origin вебзастосунку; потрібен для підстановки заголовка **`Origin`** при серверному проксуванні (щоб `CsrfGuard` на API бачив дозволений origin).
- **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** — публічний ключ віджета Turnstile (парується з секретом на backend).

Секрети OAuth / JWT / Turnstile secret на фронт **не** потрапляють.

## BFF: `proxyToBackend` (`shared/api/server/backend-proxy.ts`)

Route Handlers під `/app/api/auth/*/route.ts` пересилають запити на NestJS:

- підставляють **`Origin: NEXT_PUBLIC_APP_URL`** (за замовчуванням server-side `fetch` не шле Origin);
- проброс **`Cookie`** — access / refresh / CSRF, які API виставив раніше;
- обмежено проброс інших заголовків (`User-Agent`, `Accept-*`, `X-CSRF-Token`, CF/IP audit тощо);
- **`redirect: manual`** — щоб не втратити `Set-Cookie` при ланцюжку редіректів OAuth.

Фактичні шляхи проксі:

| Route Handler | Upstream |
|---------------|----------|
| `POST /api/auth/google/start` | `POST /auth/google/start` |
| `POST /api/auth/refresh` | `POST /auth/refresh` |
| `POST /api/auth/logout` | `POST /auth/logout` |
| `POST /api/auth/logout-all` | `POST /auth/logout-all` |
| `GET /api/auth/me` | `GET /auth/me` |

Браузер **не** викликає API-хост напряму для цих операцій — лише same-origin `/api/...`.

## Вхід через Google + Turnstile

1. Сторінка логіну рендерить віджет Turnstile (`LoginForm`), отримує одноразовий `turnstileToken`.
2. Клієнт викликає **`googleStartClient`** → `POST /api/auth/google/start` з JSON тілом (див. `feature/auth/api/client/auth.client.ts`).
3. Відповідь `{ redirectUrl }` → **`window.location.replace(redirectUrl)`** на Google.
4. Після згоди Google редіректить на **`GET /auth/google/callback` на API-сервері** (не на Next). Там виставляються cookies і виконується редірект назад на безпечний URL фронту.

Тому окремий Next Route Handler для «oauth callback» не потрібен — callback завершується на backend.

## CSRF з боку браузера

Для **`POST` / `PUT` / `PATCH` / `DELETE`** до `/api/*` **`clientFetch`** (`shared/api/client/api-client.ts`) додає **`X-CSRF-Token`**, читаючи cookie **`__Secure-csrf`** (double-submit разом із перевіркою Origin на API).

- **`credentials: include`** — щоб cookies завжди їхали на same-origin BFF.
- Опційно: при `401` виконується один спільний **`POST /api/auth/refresh`** (з CSRF), потім повтор оригінального запиту (`retryOn401`).

Важливо: анонімний **`/api/auth/google/start`** CSRF не вимагає; мутації після логіну — вимагають.

## CSP і `/login`

`middleware.ts` формує **`Content-Security-Policy`** з nonce у заголовку запиту для downstream-компонентів; на **`/login`** політика для `script-src` тимчасово м’якша (Turnstile використовує вкладені контексти, які інакше ламаються під суворим nonce-only у проді). У dev дозволено `unsafe-eval` для HMR.

## Серверні компоненти та користувач

**`serverFetchJson`** у `backend-proxy.ts` — серверний `GET` на API з пробросом `Cookie` і `Origin`; зручно для read-only даних (наприклад поточний користувач через_upstream `/auth/me`), без побічних ефектів з RSC.

Для змін стану з браузера використовуйте Route Handlers + клієнтські запити, а не приховані мутації з RSC.

## Підсумок нюансів

- Один публічний origin у браузера для застосунку; API ховається за **`BACKEND_URL`**.
- Cookies сесії та CSRF мають бути узгоджені з доменом/path, які виставляє backend (`__Secure-*`, refresh лише на `/api/auth`).
- Callback OAuth завжди перевіряйте на боці API; фронт лише стартує flow і приймає користувача після редіректу з уже виставленими cookies.

Деталі guards, ротації refresh і моделі сесій — у `backend/docs/auth.md`.
