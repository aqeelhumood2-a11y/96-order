# Security checklist

Run through this before every production launch and after any change
touching auth, payments, or data access. Items marked **(verified)** were
concretely checked during the V1.0 launch-readiness pass — see the final
report for exact evidence (dates, tool output, scores).

## Application-layer

- [x] **(verified)** Every Firestore collection denies client SDK access
  by default (`firestore.rules`) — all reads/writes go through the Admin
  SDK, gated by `services/*`'s own RBAC/ownership checks. Reviewed in
  full; no gaps found.
- [x] **(verified)** Storage denies client SDK access the same way
  (`storage.rules`); product image paths are always server-generated,
  never taken from client input.
- [x] **(verified)** CSRF: the two public pre-auth Route Handlers
  (`/api/auth/session`, `/api/auth/forgot-password`) verify same-origin
  via `lib/csrf.ts`; every authenticated mutation goes through a Next.js
  Server Action, which enforces its own Origin/Host check.
- [x] **(verified)** XSS: no `dangerouslySetInnerHTML` in the codebase
  except JSON-LD structured data, which now HTML-escapes `<`/`>`/`&`
  before injection (fixed during this pass — see
  `features/storefront/shared/structured-data.tsx`). CMS page content
  renders as plain text (`{page.content}`, not raw HTML).
- [x] **(verified)** Tap webhook signature verification: HMAC-SHA256 over
  a fixed field concatenation, constant-time comparison
  (`infrastructure/payments/tap/tap-payment-provider.ts#verifyWebhookSignature`).
  Webhook idempotency: keyed by provider event id
  (`PaymentWebhookEvent`), a redelivered event is recognized and skipped.
- [x] **(verified)** Session/cookie security: every cookie
  (`__Host-session`, `__Host-cart-id`, customer session) is `httpOnly`,
  `secure`, `sameSite: "lax"`, and `__Host-`-prefixed (Secure + no Domain
  + Path=/, so it can't be silently overwritten by a subdomain).
- [x] **(verified)** Rate limiting: login (by IP and by email), forgot-password
  (by IP and by email), back-in-stock subscribe (by IP), and the AI
  Admin Assistant (per-admin, since it's the first endpoint with a
  real per-call cost) — see `config/auth.ts#RATE_LIMITS` and
  `config/ai-assistant.ts`.
- [x] **(verified)** Content-Security-Policy: nonce-based, `strict-dynamic`,
  no `unsafe-inline`/`unsafe-eval` in production (dev-only exception for
  `unsafe-eval`, needed by webpack/Turbopack HMR) — `src/middleware.ts`.
  Verified against the full e2e suite with zero CSP violations.
- [x] **(verified)** Security headers on every response: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Strict-Transport-Security` (2yr,
  includeSubDomains, preload), `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (camera/microphone/geolocation denied) —
  `next.config.ts`.
- [x] **(verified)** Timing-safe, enumeration-resistant auth errors:
  login/forgot-password return identical errors and padded response
  timing regardless of which failure case occurred
  (`services/auth/create-session.ts`, `MINIMUM_LOGIN_RESPONSE_MS`).

## Infrastructure (requires a real GCP/Firebase project — see deployment.md)

- [ ] Firebase App Check enabled and enforced for Firestore/Auth.
- [ ] "Email Enumeration Protection" enabled in Firebase Auth console.
- [ ] Authorized domains list contains only the real production domain(s).
- [ ] Every secret (`TAP_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SMTP_PASSWORD`,
      `JOB_SECRET`) lives in Secret Manager / your platform's secret
      store, never a plain `.env` file committed or shipped.
- [ ] IAM: service accounts hold only the specific roles listed in
      `deployment.md`'s IAM section — no `roles/owner`/`roles/editor`.
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,storage` has
      actually been run against production (rules changes aren't live
      until deployed).

## Dependency vulnerabilities

**(verified)** `pnpm audit` run against the full dependency tree:

| Package | Severity | Status |
|---|---|---|
| `uuid` (transitive, via `firebase-admin`) | moderate | **Fixed** — pinned to `^11.1.1` via `pnpm.overrides` in the root `package.json`. |
| `sharp` (transitive, via `next`'s bundled image optimizer) | high | **Accepted, tracked.** No newer stable Next.js release exists yet (16.2.12 is current stable; 16.3 is canary-only) to pick up a patched libvips. Real-world exposure is bounded: sharp only ever processes admin-uploaded product images in this app, never arbitrary shopper-supplied files. Re-check on the next Next.js stable release. |
| `postcss` (transitive, via `next`) | high + moderate | **Accepted, tracked.** Same "bundled by Next, no newer stable release" situation. The specific CVEs require processing attacker-controlled CSS (malicious `sourceMappingURL` comments); this app only ever builds its own first-party Tailwind CSS, never arbitrary/user-supplied CSS, so these aren't practically exploitable in this deployment today. Re-check on the next Next.js stable release. |
| `handlebars` (transitive, via `eslint-plugin-boundaries`, a devDependency) | critical/high/moderate/low | **Accepted, no action.** Lint-only tooling, never bundled into the deployed app, never processes external/attacker-controlled input. Zero production runtime exposure. |
| `@opentelemetry/core` (transitive, via `firebase-tools`, a devDependency) | moderate | **Accepted, no action.** Same reasoning — CLI tooling, not shipped to production. |

Re-run `pnpm audit --prod` (production dependency tree only) after every
`pnpm install` and before every release — see
[release-checklist.md](./release-checklist.md).

## Payment security

- [ ] Tap sandbox verified end-to-end before switching to a live key (see
      `deployment.md`).
- [ ] Never log full card numbers/CVVs — this app never receives them at
      all (Tap's hosted checkout page handles card entry; this app only
      ever sees a charge id/status via the webhook).
- [ ] Cash workflow audit trail verified: every confirm/cancel/release
      action writes an `auditLogs` entry with the acting admin's identity.
