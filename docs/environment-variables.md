# Environment variable guide

Copy `apps/web/.env.example` to `apps/web/.env.local` for local development.
In production, set these through your hosting platform's environment/secret
manager (see [deployment.md](./deployment.md)) — never commit real values.

## Build time vs. runtime

**No environment variable is required for `pnpm build` / `next build` to
succeed.** Every Firestore/Auth/Storage-reading route and page in this app is
`export const dynamic = "force-dynamic"`, so none of them execute during
Next.js's build-time static analysis or prerendering — they only run against
a real request, at runtime. Firebase Admin SDK initialization
(`infrastructure/firebase/admin.ts`) and cart-cookie signing
(`lib/cart-cookie.ts`) are both lazy (function-scoped, not module-top-level),
so a missing var surfaces as a clear thrown error the first time a request
actually needs it, never as a build failure and never as a silent `undefined`
used deep inside a library. This is intentional: a production build must
succeed even before any of these values are configured, so the same build
artifact can be deployed once and then configured (or reconfigured) purely
through environment variables, with no rebuild.

All variables below are therefore **runtime-required or runtime-optional**,
never build-time-required. The tables below classify each one; "Required in
every environment" means "required for the app to function correctly once
it's receiving traffic," not "required to build."

## Required in every environment

| Variable | Purpose | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK config | Not a secret — safe in the browser bundle by design. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client SDK config | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client SDK config; also the Admin SDK's target project (`infrastructure/firebase/admin.ts`). | If unset, the first request that touches Firestore/Auth/Storage throws a clear `"NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set"` error instead of failing confusingly inside the Firebase SDK. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client SDK config; also drives `next.config.ts`'s image `remotePatterns`. | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client SDK config | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client SDK config | |
| `CART_COOKIE_SECRET` | Signs the guest-cart cookie (`lib/cart-cookie.ts`). | Long random string (`openssl rand -hex 32`). Rotating it invalidates every existing guest cart cookie (harmless — carts start empty again, no error). |

## Required for server-side Firebase Admin access

No env var — server code authenticates via **Application Default
Credentials**, not a service-account JSON blob in an env var (see
`apps/web/src/infrastructure/firebase/admin.ts`). Locally, point
`GOOGLE_APPLICATION_CREDENTIALS` at a gitignored service-account key file;
on Vercel/Cloud Run/App Hosting, the platform's default service account is
used automatically — grant it the roles listed in
[deployment.md#iam](./deployment.md#iam-permissions).

## Optional — each has a safe, fully-functional fallback with zero config

Every one of these follows the same pattern: absence selects a safe,
zero-credential default (a fake/console/disabled implementation); presence
selects the real one automatically, with no code change.

| Variable | Enables | Fallback when unset |
|---|---|---|
| `TAP_SECRET_KEY` | Real Tap Payments card charges (`infrastructure/payments/tap/tap-payment-provider.ts`). | `FakeTapProvider` — a working simulated card flow for dev/CI. |
| `ANTHROPIC_API_KEY` | The real AI Admin Assistant (`infrastructure/ai/anthropic-assistant-provider.ts`), calling Anthropic's Messages API directly. | `RuleBasedAssistantProvider` — a deterministic data-snapshot digest, always correct, never fabricated. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | Real transactional email delivery (`infrastructure/email/smtp-email-provider.ts`) — vendor-neutral, works with Amazon SES, SendGrid, Postmark, Mailgun, or any other SMTP-capable ESP. All six must be set together. | `ConsoleEmailProvider` — logs the rendered email instead of delivering it. **This is a real pre-launch requirement, not just a dev convenience** — see [deployment.md](./deployment.md). |
| `JOB_SECRET` | The three scheduled job routes and the ERP order-sync route (see [monitoring.md](./monitoring.md)). Sent as `Authorization: Bearer <value>`. | Every job/integration route returns 401 for every request — disabled by default, never accidentally exposed with no auth. |

## Optional — cosmetic/SEO

| Variable | Purpose | Fallback |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute origin for canonical URLs, Open Graph tags, `sitemap.xml`, `robots.txt` (`config/site.ts`). | `http://localhost:3000` — **must be set to the real production domain before launch**, or every canonical/OG/sitemap URL will be wrong. |
| `PICKUP_LOCATION_ID` / `PICKUP_LOCATION_NAME` / `PICKUP_LOCATION_ADDRESS` | The single pickup location shown at checkout (`config/pickup.ts`). | A placeholder "96 Order Roastery" location — replace with the real store address before launch. |

## Emulator-only (never set these in production)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | `"true"` points the client SDK at the local Firebase Emulator Suite. |
| `FIREBASE_STORAGE_EMULATOR_HOST` | Storage emulator host:port, used by `infrastructure/firebase/product-image-storage.ts` to build local download URLs. |
| `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` | Standard Firebase Admin SDK emulator redirection (read internally by `firebase-admin`, not by app code directly). |

These are all set for you by `apps/web/.env.test` when running
`pnpm test:integration` / `pnpm test:e2e:auth` — see the root README's
"Getting started" section.

## Production pre-launch checklist for this page

- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain (with `https://`).
- [ ] `NEXT_PUBLIC_FIREBASE_*` point at the **production** Firebase project, not the dev/staging one.
- [ ] `CART_COOKIE_SECRET` is a fresh, unique random value (not reused from dev).
- [ ] `TAP_SECRET_KEY` is the **live** key (see [deployment.md](./deployment.md) for the sandbox→live checklist).
- [ ] `SMTP_*` fully configured with a real ESP — see the note above; this is a launch blocker, not optional polish.
- [ ] `JOB_SECRET` is a fresh random value, matching what's configured in Cloud Scheduler (`ops/setup-cloud-scheduler.sh`).
- [ ] `PICKUP_LOCATION_*` reflects the real store location.
- [ ] `ANTHROPIC_API_KEY` set only if you want the live AI Assistant (optional).
- [ ] Every secret above is stored in your platform's secret manager, never in a checked-in `.env` file — see [deployment.md](./deployment.md).
