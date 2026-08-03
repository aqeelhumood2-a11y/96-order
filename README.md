# Ninety Six Degrees Cafe — Premium Coffee & Equipment E-commerce Platform

A production-grade, enterprise e-commerce platform for coffee beans, coffee
products, brewing equipment, machines, grinders, filters, accessories, and
related supplies — built phase by phase on Clean Architecture so every
future module (catalog, admin, CMS, auth/RBAC, orders, ERP, POS, wholesale,
multi-tenant, ...) plugs in without restructuring what already exists.

**Stack:** Next.js (App Router) · React · TypeScript · Firebase (Firestore,
Auth, Storage, Cloud Functions) · Tailwind CSS · GitHub · Vercel.

**Status:** Phase 1 (Foundation) through Phase 8 (Official Brand Identity
and Production Readiness) are complete. Guest and registered-customer
checkout, Bahrain delivery/pickup scheduling, cash and Tap-card payments
(each independently enable/disable-able from Site Settings), public order
tracking, customer accounts with saved addresses/wishlist/back-in-stock
alerts, product reviews and Q&A, coupons and automatic promotions, an
admin-editable CMS and site settings/homepage/navigation, the full admin
back office (order management, customers, inventory operations, dashboard,
reporting, cash/online payment reports, an AI Admin Assistant, an
integrations manager), and the official Ninety Six Degrees Cafe brand
identity now exist end-to-end. No refund execution, POS, wholesale, or
multi-tenant modules exist yet; a real external ERP is not integrated
(only the read-only sync feed it would poll — see Phase 8 below).

## Repository layout

A pnpm workspace, because the Next.js app (deploys to Vercel) and Cloud
Functions (deploys via the Firebase CLI) are two separate runtimes that
still need to share the same domain logic and validation rules.

```
96-order/
  apps/web/            Next.js App Router app
  functions/            Firebase Cloud Functions (2nd gen, Node.js 22)
  packages/shared/      @96order/shared — domain errors, pure utilities, shared types
  firebase.json, .firebaserc, firestore.rules, firestore.indexes.json, storage.rules
  .github/workflows/ci.yml
```

### `apps/web/src` — Clean Architecture layers

```
app/              Routes only. Thin composition/wiring — no business logic.
core/             Domain layer: entities, port interfaces, typed errors. Pure — no framework imports.
                  core/auth/ — permissions.ts (namespaces/actions/Permission type/hasPermission),
                  entities.ts (StaffUser, Role, AuditLogEntry, Session).
features/         Vertical slices (one folder per feature): home, admin-auth, staff, roles, admin-shell.
services/         Use-case orchestration. Depends on core's interfaces, wires in infrastructure.
                  services/auth/ — session.ts (getSession/requireSession/requirePermission) and one
                  file per use case (create-session, create-staff, assign-roles, create-role, ...).
infrastructure/   Concrete adapters (Firebase client/admin SDK, Firestore repositories) implementing core's ports.
ui/               Design system: Radix-based primitives (ui/primitives) and layout shells (ui/layout). No business logic.
lib/              Cross-cutting utilities: env validation, logger, className helper, CSRF check, action-result mapping.
config/           Code-level constants (not CMS content — CMS is a later phase). config/auth.ts holds
                  the session cookie name and rate-limit thresholds.
types/            Shared ambient/global types.
middleware.ts     Edge-runtime, cheap "is there a session cookie?" redirect — UX only, not authoritative
                  (see Session & security architecture below).
```

The dependency direction is enforced by `eslint-plugin-boundaries`
(`apps/web/eslint.config.mjs`): `core` cannot import from any outer layer,
`ui` cannot import business logic, and `features`/`app` cannot reach into
`infrastructure` directly — they go through `services`. Run `pnpm lint` to
see it in action; violating the rule is a lint error, not a suggestion.

One narrow, deliberate exception exists, from `lib` only: `lib` may import
`core`, so `lib/action-result.ts` can map thrown `AppError`s to a typed
Server Action result. A second exception (`lib` → `infrastructure`, for a
client-side Firebase Auth SDK wrapper) existed briefly in Phase 2 and has
since been removed along with the client-side auth code it supported — see
"ESLint boundary exceptions" under Phase 2 below for the full history.
`lib`, `features`, `ui`, and `app` all cannot import `infrastructure`
directly; only `services` (the composition root) and `infrastructure`
itself can.

**Adding a future feature module** (e.g. a coffee product catalog): add
`core/interfaces/product-repository.ts` (the port), an implementation under
`infrastructure/repositories/firestore-product-repository.ts`, a use case in
`services/`, and the UI in `features/catalog/`. Nothing in `app/`, `ui/`, or
any other feature needs to change.

## Production operations documentation

For deploying, monitoring, and running this app in production — separate
from this README's phase-by-phase architecture/feature history — see
[docs/](./docs/README.md): deployment guide, environment variable
reference, backup/disaster-recovery, operations & maintenance, monitoring,
troubleshooting, security checklist, and release checklist.

## Getting started

Requires Node.js 22 and [Corepack](https://nodejs.org/api/corepack.html)
(bundled with Node ≥16.9; run `corepack enable` once if it's not already on).
The exact pnpm version is pinned in the root `package.json`'s
`packageManager` field — Corepack will fetch and use it automatically.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # then fill in your Firebase project's values
pnpm run dev                                    # apps/web on http://localhost:3000
```

### Environment variables

`apps/web/.env.example` documents every variable. The Firebase **client**
config (`NEXT_PUBLIC_FIREBASE_*`) is not secret — it's safe in the browser
bundle by design; access is enforced by Firestore/Storage Security Rules and
App Check, not by hiding this config. Get these values from the Firebase
console under **Project settings → General → Your apps**.

There is deliberately no service-account JSON anywhere in this repo or in
env files. Server-side Firebase Admin access
(`apps/web/src/infrastructure/firebase/admin.ts`) uses **Application
Default Credentials** instead:

- **Deployed Cloud Functions / other Google Cloud runtimes** — ADC picks up
  the runtime's attached service account automatically. Nothing to configure.
- **Local development** — run `gcloud auth application-default login` once,
  or point `GOOGLE_APPLICATION_CREDENTIALS` at a local, gitignored key file.
  Never commit that file or paste its contents into an env var.
- **Any future server-side secret** (payment provider keys, etc.) should go
  through Secret Manager, not a raw env var — see the Backlog.

### Firebase Emulator Suite

Rules and Firebase integrations are tested locally without touching your
real project:

```bash
pnpm run emulators     # Firestore :8080, Auth :9099, Storage :9199, Functions :5001, UI :4000
```

With the emulators running, set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in
`apps/web/.env.local` so the client SDK connects to them instead of
production, and start the app as usual. The Admin SDK auto-detects the
emulator env vars that `firebase emulators:start` exports, so it needs no
credentials at all in that mode.

Before any of this can talk to a real project, update `.firebaserc`'s
`default` project ID and run `firebase use --add` once.

## Scripts (run from the repo root)

| Script | What it does |
| --- | --- |
| `pnpm run dev` | Builds `@96order/shared`, then starts the Next.js dev server |
| `pnpm run build` | Builds `@96order/shared`, Cloud Functions, then the Next.js app |
| `pnpm run lint` | Lints every workspace package (includes the Clean Architecture boundary check) |
| `pnpm run typecheck` | Type-checks every workspace package |
| `pnpm run test` | Runs Vitest unit tests in every workspace package (mocked ports, no emulator) |
| `pnpm run test:integration` | Firestore/Storage adapter + security-rules tests against the Emulator Suite (`firebase emulators:exec`, now including `storage`) |
| `pnpm run test:e2e` | Playwright not-found-page smoke test against a production build (no emulator — the only page left that needs no Firebase backend at all) |
| `pnpm run test:e2e:auth` | Playwright auth/RBAC (Phase 2), catalog admin (Phase 3), public storefront (Phase 4), **and** cart/checkout/tracking (Phase 5) e2e suites against the Emulator Suite |
| `pnpm run emulators` | Starts the Firebase Emulator Suite |
| `pnpm run bootstrap:super-admin` | One-time super-admin bootstrap — see below |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, integration
tests, the build, and both Playwright suites on every push and pull request.
It does not deploy anything — deploy wiring is a later-phase concern.

## Security baseline

- `firestore.rules` and `storage.rules` default-deny **everything** except
  explicit, narrow rules for the Phase 2 collections (`users`, `roles`,
  `auditLogs`, `system`, `rateLimits`) and the Phase 3 collections/paths
  (`products`, `categories`, `brands`, `inventory`, `inventoryAdjustments`,
  `catalogUniqueKeys`, and `products/{productId}/{imageFile}` in Storage),
  all of which are also deny-all — see Phase 2's and Phase 3's data-model
  sections for why. No other collection or storage path is opened up until
  its real access pattern is designed in the phase that introduces it.
  **Phase 4 changes none of this**: the public storefront reads Firestore
  exclusively through the server-side Admin SDK (`services/storefront/*`),
  which bypasses security rules entirely by design (the same way every
  admin Server Action already does) — there was never a reason to weaken
  the deny-all client rules just to make the storefront work, and Phase 4
  didn't.
- No secrets are committed anywhere in this repo; `.gitignore` covers `.env*`
  and any file matching `*service-account*`/`*serviceAccountKey*`.
- Images are restricted in `next.config.ts` to this project's own Firebase
  Storage bucket (via `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`) — no wildcard
  remote hosts.
- Session cookies are `__Host-` prefixed, `HttpOnly`, `Secure`, `SameSite=Lax`.
- No admin-area Server Action or Route Handler trusts `middleware.ts` or a
  page's layout for authorization — each calls `requireSession()`/
  `requirePermission()` itself. See Phase 2 below for why that matters.

## Phase 1 — Foundation (out of scope items, now built in Phase 2 or later)

Phase 1 shipped no business features and no auth. Authentication flows and
RBAC were out of scope for Phase 1 and are covered by Phase 2 below. Product
catalog, admin business screens (beyond the minimal staff/roles shell), CMS,
orders, payments, and shipping remain out of scope until the phases that
build them.

## Phase 2 — Authentication, Admin Access & RBAC

Adds Firebase Authentication (staff only, email/password), server-managed
sessions, a modular RBAC foundation, and a minimal protected admin shell —
no catalog, orders, CMS, payments, or other business modules.

### Auth architecture

- **Login** (`/admin/login`, public): a client component POSTs the raw
  `{ email, password }` directly to `POST /api/auth/session` — it no longer
  calls the Firebase client SDK at all. This closed the original gap where
  a caller could invoke `signInWithEmailAndPassword` straight from the
  browser and skip our rate limiter entirely: now our server is the *only*
  path that ever verifies a password, so nothing can bypass the limiter in
  front of it.
- **Session creation** (`services/auth/create-session.ts`): consumes the
  IP and email rate limits **before** any password verification is
  attempted, then verifies the password server-side against Identity
  Toolkit's REST API (`infrastructure/firebase/identity-toolkit-rest.ts` —
  the Admin SDK has no password-verification method, so this is a thin,
  server-only REST call, never exposed to the browser), confirms the uid
  has an **active** `users/{uid}` staff record (a valid Firebase Auth
  account alone is not authorization), mints a session cookie via
  `createSessionCookie`, records `lastLoginAt`, and writes a
  `login_success`/`login_failure` audit log entry. See "Rate limiting
  design" below for the full mechanics.
- **Verification** (`services/auth/session.ts`): `getSession()` reads the
  `__Host-session` cookie and calls `verifySessionCookie(cookie, true)` —
  the `true` (`checkRevoked`) is mandatory, not optional: without it,
  neither deactivating a staff account nor a force-logout actually
  invalidates an already-minted cookie before it naturally expires.
  `requireSession()`/`requirePermission()` throw `UnauthorizedError`/
  `ForbiddenError`; every page, Server Action, and Route Handler under
  `/admin` calls one of these directly.
- **Logout**: `DELETE /api/auth/session` clears the cookie and audit-logs
  `logout`. Staff-initiated **force logout**
  (`services/auth/revoke-staff-sessions.ts`) calls Admin SDK
  `revokeRefreshTokens` directly — no extra bookkeeping field needed,
  `checkRevoked: true` picks it up natively.
- **Custom claims**: minimal only (`{ sa: true }` for super admin, set by
  the bootstrap script). Claims are capped at 1000 bytes and must never
  carry the full role/permission list — all real authorization reads
  Firestore server-side.
- **No public staff registration.** The only ways a staff account comes
  into existence are the bootstrap script (the first super admin) and
  `create-staff` (an already-authorized staff member, gated by
  `staff:create`/`staff:manage`).

### Session flow (request-by-request)

1. `middleware.ts` (Edge runtime) does a cheap "is there a session cookie
   at all?" check on `/admin/**` (excluding `/admin/login` and
   `/admin/forgot-password`) and redirects to login if absent. **This is
   UX-only defense-in-depth, not the authorization boundary** — the Admin
   SDK's `verifySessionCookie` needs Node APIs unavailable on the Edge
   runtime, and middleware doesn't run for Server Actions or Route
   Handlers at all, only page navigations.
2. `app/admin/(protected)/layout.tsx` (Node runtime, Server Component)
   calls `getSession()` and redirects to login if it's `null`. Still
   UX-only: a layout doesn't run for Server Actions or Route Handlers
   either.
3. **Every** page, Server Action, and Route Handler under `/admin`
   independently calls `requireSession()`/`requirePermission()` — this is
   the actual, only enforcement boundary, deliberately duplicated at every
   entry point rather than assumed from #1/#2. React's `cache()` wrapping
   `getSession()` means this costs one Firestore user-doc read (plus a
   small number of role-doc reads) per request, shared across every caller
   within that one request, not per-call.

### RBAC model

`core/auth/permissions.ts` defines the fixed set — **no business modules
implement any of it in Phase 2**:

- **Namespaces**: `dashboard, products, categories, brands, inventory,
  orders, customers, reports, cms, settings, payments, integrations,
  staff, audit_logs`.
- **Actions**: `view, create, edit, delete, export, manage` (`manage` is a
  wildcard for every other action in that namespace).
- **Permission** = `"{namespace}:{action}"`, e.g. `"staff:manage"`.
- **Super admin** (`SUPER_ADMIN_ROLE_ID = "super_admin"`): a user whose
  `roleIds` includes this reserved id bypasses every permission check
  unconditionally in `hasPermission()` — not "has every permission listed
  out," an actual bypass.
- **Effective permissions** are resolved per-request (union of every
  assigned role's permissions plus any `directPermissions`) — not
  denormalized into Firestore, to avoid cascade-update complexity for a
  foundation phase with few roles. See Backlog if this becomes a real cost
  concern later.
- **`/admin/roles` (role administration) is gated behind `staff:manage`**,
  not a dedicated namespace — RBAC administration is core auth
  infrastructure, not a business module, so it doesn't get one of the 14
  reserved namespaces. This is a deliberate trust call, not an oversight:
  **`staff:manage` is effectively near-super-admin-level trust.** A holder
  could create a new role granting every namespace's `manage` action and
  assign it to themselves. The mitigation the spec actually requires —
  "super admin cannot be deleted or stripped of required access" — is
  enforced regardless of caller permission:
  - `update-role.ts`/`delete-role.ts` refuse to modify or delete any role
    where `isSystemRole === true` (today, only `super_admin`), full stop.
  - `assign-roles.ts` refuses to remove `super_admin` from an account that
    holds it.
  - `set-staff-status.ts` refuses to deactivate an account holding
    `super_admin`.
  - There is no demotion path for a super admin in Phase 2 — see Backlog.

### First super-admin bootstrap

`pnpm --filter web run bootstrap:super-admin -- --email=someone@example.com`
(root alias: `pnpm run bootstrap:super-admin -- --email=...`). This is a
plain script (`apps/web/scripts/bootstrap-super-admin.ts`, run via `tsx`),
**not a route** — structurally unreachable over HTTP.

1. The target Firebase Auth user must already exist (create it via the
   Firebase Console or a separate Admin SDK call) — the script never
   receives or handles a raw password.
2. If `system/bootstrap.superAdminInitialized` is already `true`, the
   script prints a message and exits — idempotent, and this is the only
   enforcement of "disabled after initialization." There is no code path
   in this script for creating a *second* super admin; later ones are
   promoted via normal in-app role assignment by an existing one.
3. Otherwise it sets the `{ sa: true }` custom claim (idempotent, safely
   retryable) **before** running a Firestore transaction that seeds the
   `super_admin` role, upserts the `users/{uid}` doc, and marks
   `superAdminInitialized = true`. That order is deliberate: if the
   process dies between the two steps, the flag is still `false` so a
   re-run retries safely; the reverse order could leave the flag set with
   the claim never actually applied.

Requires Application Default Credentials in the running shell (see
Environment variables below) — the same ADC the rest of the app uses,
never a service-account JSON.

### Staff-management rules

- Only `staff:create` (or `staff:manage`, via the namespace wildcard) can
  create a staff account (`create-staff.ts`). Creation never sets a
  password: the Auth user is created with none, and the server
  automatically triggers a password-setup email via
  `AuthSessionPort.sendPasswordResetEmail` (see "Password-reset delivery"
  below) — the admin UI shows only a confirmation that an email was sent,
  never a link.
- `staff:edit` (or `staff:manage`) is required to activate/deactivate
  (`set-staff-status.ts`), reassign roles (`assign-roles.ts`), force-logout
  (`revoke-staff-sessions.ts`), or initiate a password reset for an
  existing staff member (`initiate-password-reset.ts`).
- Deactivating an account also revokes its refresh tokens — deactivation
  implies immediate force-logout, not just "blocked from a future login."
- Staff can never self-register; there is no public registration route.

### Emulator setup

```bash
pnpm run emulators                # interactive: Firestore :8080, Auth :9099, UI :4000
pnpm run test:integration         # Firestore adapters + security rules, wrapped in firebase emulators:exec
pnpm run test:e2e:auth            # Playwright auth/RBAC suite, wrapped in firebase emulators:exec
```

The two test commands run their own emulator session automatically (via
`firebase emulators:exec --project demo-96order`) — you don't need
`pnpm run emulators` running separately for them. `demo-96order` is a
Firebase `demo-`-prefixed project id, which the Emulator Suite treats as
test-only and which cannot collide with any real GCP project; it's
intentionally different from whatever real project `.firebaserc` points at
for eventual deployment. Firestore's emulator needs a JVM — any Java 17+
runtime works (CI installs Temurin 21 explicitly via `actions/setup-java`).

`apps/web/tests/e2e/global-setup.ts` seeds two fixture accounts directly
via the Admin SDK before the auth e2e suite runs: a super admin and a
staff member with no permissions.

### Required environment variables (Phase 2 additions)

No new variables beyond what Phase 1 defined
(`apps/web/.env.example`/`.env.test`) — Phase 2 reuses
`NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`. Nothing
Phase-2-specific needs a service-account JSON or any other secret env var;
session cookies, custom claims, and rate limiting are all built from ADC +
Firestore.

### Rate-limiting design

Every public, pre-auth, state-changing Route Handler consumes a rate limit
**before** doing anything password- or token-related, and there is no
client-reachable path that skips it — this was the central Phase 2
correction, so it's documented in full here.

- **Why the old design was bypassable, and what changed.** The original
  login flow had the browser call the Firebase client SDK's
  `signInWithEmailAndPassword` directly against Identity Toolkit, then hand
  our server an already-minted ID token. Our rate limiter sat *after* that
  point (at session-cookie creation), so a caller could skip our UI/API
  entirely, call Identity Toolkit straight from a script, and guess
  passwords with no exposure to our limiter at all. The fix was
  architectural, not a tweak: the password is now verified **only**
  server-side. `POST /api/auth/session` accepts `{ email, password }`
  directly; `create-session.ts` consumes both rate limits, and only then
  calls `AuthSessionPort.signInWithPassword`, which proxies to Identity
  Toolkit's REST API from the server
  (`infrastructure/firebase/identity-toolkit-rest.ts`). The browser has no
  way to reach Identity Toolkit on its own anymore for this flow, so there
  is no longer a code path that reaches password verification without
  passing through the limiter first. The same restructuring applies to
  forgot-password (see below).
- **What's rate-limited, by what key, with what limits**
  (`config/auth.ts`'s `RATE_LIMITS`, all fixed 15-minute windows):
  - `POST /api/auth/session`: by IP (`sessionCreateByIp`, 10/15m) **and**
    by normalized email (`sessionCreateByEmail`, 5/15m) — both consumed,
    in that order, before `signInWithPassword` is ever called.
  - `POST /api/auth/forgot-password`: by IP (`forgotPasswordByIp`, 5/15m)
    and by normalized email (`forgotPasswordByEmail`, 3/15m), before the
    audit log is written or delivery is scheduled.
  - Bootstrapping the first super admin is not an HTTP endpoint at all
    (`apps/web/scripts/bootstrap-super-admin.ts`, invoked by an operator's
    shell, never a route) — there is no public request path to rate-limit
    because there is no public request path, full stop. `system/bootstrap`
    also enforces that it can only ever run its write once (see "First
    super-admin bootstrap" above), which is the actual replay protection
    for that flow.
- **Keys are hashed, not stored raw.** `firestore-rate-limiter.ts` never
  writes an IP address or email in the clear to `rateLimits/{key}` — the
  document id is `sha256(key)` (`hashKey()`), computed inside `consume()`
  so every call site is automatically covered. The counter document itself
  is just `{ count, windowStartMs, expiresAt }`; there is nothing in
  Firestore that reveals which email or IP a given counter belongs to.
- **Enumeration-safety.** Every failure branch inside `create-session.ts` —
  IP limit exceeded, email limit exceeded, wrong password, unknown email,
  correct password but the account is deactivated or isn't staff at all —
  throws the same error type with the same message
  (`"Invalid email or password."`, or the rate-limit message when that's
  the branch, which is itself the *same* generic text on both the IP and
  email limit). The real reason is recorded in the audit log (admin-only,
  never client-visible), not in the HTTP response. The whole call is
  wrapped in `finally { await padToMinimumDuration(startedAt,
  MINIMUM_LOGIN_RESPONSE_MS) }` (300ms floor) so that the extra Firestore
  read on the "valid credentials but not an active staff account" branch
  doesn't respond measurably faster or slower than a plain wrong-password
  rejection — without this, timing alone would leak which branch executed
  even with identical status codes and bodies.
- **How this complements Firebase's own abuse protection, and where the
  line is.** Identity Toolkit has its own backend throttling independent
  of us — `IdentityToolkitError` with code `TOO_MANY_ATTEMPTS_TRY_LATER`
  is mapped to the same `RateLimitedError` our own limiter throws
  (`infrastructure/firebase/auth-session.ts`), so a caller can't
  distinguish "our limiter tripped" from "Google's tripped." The two are
  complementary, not redundant: our Firestore-backed limiter is the
  primary, fast, cheap gate tuned to our own thresholds and is what the
  regression tests below prove can't be bypassed; Firebase's own
  protection is a second, coarser backstop against sustained abuse that
  keeps working even if our limiter were ever misconfigured or disabled,
  and it also covers surfaces we don't proxy (e.g. token refresh). Neither
  one substitutes for the other.
- **App Check stays in the backlog, correctly scoped.** App Check /
  reCAPTCHA (still Backlog, not built) would add device/browser attestation
  on top of both of the above — it is not "the fix" for the bypass
  described above, because that bypass was about *which code path* password
  verification could take, not about distinguishing bot traffic from human
  traffic. It remains a good future layer against scripted abuse generally,
  independent of this correction.
- **Regression tests proving no bypass**
  (`apps/web/tests/integration/rate-limiting.test.ts`, run against the real
  emulator): calls the real, exported `POST` handlers directly — not the
  service layer with mocked ports — `limit + 2` times for session creation
  and `limit + 1` times for forgot-password with the same email/IP, and
  asserts every attempt past the configured limit gets `429` with
  `{ code: "RATE_LIMITED" }`, while attempts within the limit are still
  let through to the real (failing, since the account doesn't exist)
  auth/delivery call. A third test confirms a cross-origin request is
  rejected by CSRF regardless of rate-limit state, so the two checks are
  proven independent of each other.
- **`rateLimits/{key}` has no automatic expiry wired up yet.** A Firestore
  TTL policy needs to be configured out-of-band (not expressible in
  `firebase.json`): `gcloud firestore fields ttl-policies create --collection-group=rateLimits --field=expiresAt --database='(default)'`.
  The `expiresAt` field is already written; this command just needs to be
  run once against your real project. This is a cost/storage-hygiene
  cleanup task, not a security gap — expired windows are already correctly
  ignored by `consume()`'s own logic regardless of whether the stale
  documents are physically deleted yet.

### Password-reset delivery

Forgot-password is now fully server-side, end to end — the client never
calls Firebase directly, and no reset link is ever exposed anywhere outside
Firebase's own hosted email.

- **Flow**: `/admin/forgot-password` (public UI) POSTs `{ email }` to
  `POST /api/auth/forgot-password`. The route
  (`services/auth/request-password-reset.ts`) checks the same-origin CSRF
  guard, consumes the IP and email rate limits, records a
  `password_reset_requested` audit entry (`actorEmail` only — no token,
  no link, no secret in the metadata), and always returns the identical
  `{ ok: true }` response whether or not the account exists. Delivery
  itself is scheduled via `after(() => authSession.sendPasswordResetEmail(...))`
  — Next's `after()` API, not an awaited call (which would leak delivery
  latency into the response, reopening enumeration) and not a bare
  un-awaited promise (which a serverless platform can freeze mid-flight
  the instant the response is sent, silently dropping it). `after()` is
  Next's own guarantee that the function stays alive long enough to finish
  the send without the client waiting on it.
- **How delivery actually happens**: `sendPasswordResetEmail` calls
  Identity Toolkit's `sendOobCode` REST endpoint directly from the server
  (`infrastructure/firebase/identity-toolkit-rest.ts`), which is Firebase's
  own normal password-reset email flow — the same one the client SDK's
  `sendPasswordResetEmail` triggers, just invoked server-side instead of
  from the browser, so it is gated by our rate limiter and CSRF check
  first. No third-party email provider, secret, or API key is involved or
  hardcoded — the only credential in play is the same `NEXT_PUBLIC_FIREBASE_API_KEY`
  already used elsewhere.
- **The link is never exposed.** `AuthSessionPort` has no method that
  returns a reset link at all anymore (`generatePasswordResetLink` was
  removed from the port entirely) — `sendPasswordResetEmail` returns
  `Promise<void>`, and its Firestore/infrastructure implementation
  swallows delivery errors (`.catch(() => undefined)`) rather than
  surfacing them, specifically so there is no code path, response, log
  line, or admin-UI state that could ever carry the link. `create-staff.ts`
  and `initiate-password-reset.ts` both call this same method and both
  return only `{ uid }` / nothing to the caller — never a link.
- **Required post-deployment configuration** (not code — this must be set
  in the Firebase Console for the real project before this flow works in
  production): configure the Auth email template's action URL/domain under
  **Authentication → Templates → Password reset**, add your real
  production domain to **Authentication → Settings → Authorized domains**,
  and enable **Email enumeration protection** under **Authentication →
  Settings** so Identity Toolkit's own response shape doesn't leak account
  existence either (our application-level response was already generic
  regardless, but this closes the same gap at Google's layer too).
- **Test-only visibility, not production.** The Auth emulator exposes
  sent OOB codes via its own inspection REST endpoint
  (`http://localhost:9099/emulator/v1/projects/{projectId}/oobCodes`) purely
  for local/CI test inspection — production code never calls or exposes
  this endpoint, and it doesn't exist against a real Firebase project.

### Audit-log immutability

Because the Admin SDK bypasses Firestore Security Rules entirely (rules
only constrain client SDK access), "the repository interface only exposes
`record()`" needed verification that it actually holds everywhere in the
app, not just by inspection:

- **No update or delete method exists anywhere in the path.**
  `AuditLogRepository` (`core/interfaces/audit-log-repository.ts`) defines
  only `record()` and `list()` — there has never been an `update`/`delete`
  signature to accidentally wire up. `FirestoreAuditLogRepository`
  implements exactly those two methods and nothing else.
- **No application code can reach the raw collection another way.**
  `apps/web/tests/unit/audit-log-immutability.test.ts` recursively scans
  every file under `src/` for the string literal `"auditLogs"` and asserts
  the only match is inside the repository implementation itself — so
  nothing in `services/`, `features/`, or `app/` holds a second, informal
  handle on the collection that could sidestep the port.
  It further scans every `services/` call made against something matching
  the `auditLogs`/`AuditLogRepository` shape and asserts it's always
  `.record(...)` or `.list(...)`, never anything else — this is checked
  with a "the scan actually found calls to check" assertion so the test
  can't pass vacuously by matching nothing.
- **Server-controlled fields, not attacker-controlled.** `record()`'s
  Firestore write sets `createdAt: FieldValue.serverTimestamp()` — the
  server's clock, never a client-supplied timestamp — and the method
  signature only accepts `{ type, actorUid, actorEmail?, targetUid?,
  metadata }`; there is no code path where an arbitrary request body is
  spread directly into the write, so a caller cannot inject a forged
  `createdAt`, override `actorUid`, or add trusted-looking fields the audit
  reader would trust. Every call site constructs this object from
  server-derived values (the verified session, the verified token, or a
  hardcoded literal) — never from `req.body` directly.
- **This is defense the application layer actually owns; Firestore Rules
  are not, and cannot be, part of that boundary for Admin SDK writes.**
  `firestore.rules` denies all client access to `auditLogs` as a
  defense-in-depth backstop against a misconfigured or compromised
  client-facing surface, but it has **zero effect** on what the Admin SDK
  itself can do — rules only evaluate for the client SDKs. The real,
  load-bearing boundary against a compromised server process or a rogue
  operator with direct Admin SDK access is **operational IAM**: whoever
  can deploy code or run `gcloud`/console actions against the real Firebase
  project with Editor/Owner (or a custom role with `datastore.entities.*`)
  can bypass every guarantee described above, because none of them are
  enforced by Firestore itself. Restricting which service accounts and
  humans hold that IAM role in the real GCP project is a deployment/ops
  responsibility outside this codebase, not something any amount of
  application code can substitute for.

### ESLint boundary exceptions

The Phase 2 review asked for the exact exceptions and justification for
each. There is now **one**, not two — the second was eliminated by the
same architectural change that fixed rate-limiting (removing all
client-side Firebase Auth SDK usage removed the only reason browser code
needed to touch `infrastructure` at all):

1. **`{ from: "lib", allow: ["lib", "core", "types"] }`** (`lib` → `core`).
   `core` is the innermost ring (depends on nothing else in the app), so
   this can never create a cycle. It exists because
   `lib/action-result.ts` maps a thrown `AppError` (defined in
   `core/errors`) to a typed Server Action result (`{ ok: false, error }`)
   — every feature's Server Actions reuse this one mapping instead of each
   duplicating `error instanceof ForbiddenError ? ... : ...` chains. This
   exception is narrow (one specific, one-directional, acyclic edge) and
   still in place.
2. **`{ from: "lib", allow: [..., "infrastructure"] }`** (`lib` →
   `infrastructure`) — **removed.** This existed only to let a client-side
   wrapper (`lib/firebase-client-auth.ts`) call the Firebase client Auth
   SDK for login and password reset. Once login and password-reset
   delivery moved entirely server-side (see Rate-limiting design and
   Password-reset delivery above), no browser-executed code needed to
   import Firebase at all, so that file was deleted rather than kept
   around unused, and the exception was deleted with it — not narrowed,
   eliminated. `lib`, `features`, `ui`, and `app` all now get a flat
   `disallow` on `infrastructure`; only `services` (the composition root,
   `services/auth/dependencies.ts`) and `infrastructure` itself may import
   `infrastructure`.
3. **Regression tests**
   (`apps/web/tests/unit/architecture-boundaries.test.ts`) run ESLint's own
   Node API (`new ESLint({ cwd: ... })`) against real fixture files written
   to each layer at test time, and assert `boundaries/element-types`
   violations fire for: `features`, `app`, `ui`, and `lib` all importing
   `infrastructure` directly; `core` importing `services`. They also assert
   the *allowed* edges don't false-positive: `services` importing
   `infrastructure`, and `lib` importing `core`. This means a future
   attempt to reintroduce a direct infrastructure import from outside the
   composition root — or to accidentally invert `core`'s purity — fails CI
   immediately, not just at manual review.

### Super-admin safety model

- **The `super_admin` role cannot be deleted or edited.** `update-role.ts`
  and `delete-role.ts` refuse any mutation where the target role has
  `isSystemRole === true` — today, only `super_admin` — regardless of the
  caller's permissions, including another super admin.
- **The last active super admin cannot be deactivated or lose the role.**
  `set-staff-status.ts` and `assign-roles.ts` both call
  `assertNotRemovingLastActiveSuperAdmin()`
  (`services/auth/super-admin-guard.ts`) whenever the operation would
  deactivate an account holding `super_admin`, or would remove
  `super_admin` from an account's `roleIds`. The guard runs
  `UserRepository.countActiveUsersWithRole(SUPER_ADMIN_ROLE_ID)` — a real
  Firestore `count()` aggregate query, backed by a new composite index
  (`users` on `status ASC, roleIds ARRAY_CONTAINS` in
  `firestore.indexes.json`) — and throws `ForbiddenError` if the count is
  `≤ 1`, i.e. the target is the only active super admin left. When at
  least one other active super admin exists, the operation is allowed —
  Phase 2 doesn't block *all* changes to a super admin's role/status, only
  the one that would leave zero.
  - This replaced an earlier, blunter rule ("never touch a super admin at
    all") once it was clear that rule would make even legitimate
    multi-super-admin operation impossible; the guard is called only on
    the specific state transition that's actually dangerous (going from
    "has the role/is active" to "doesn't/isn't"), not on every write to a
    super-admin account.
- **Session revocation after deactivation.** `set-staff-status.ts` calls
  `AuthSessionPort.revokeRefreshTokens(uid)` whenever an account is set to
  `deactivated` (super admin or not) — combined with `getSession()`'s
  mandatory `verifySessionCookie(cookie, /* checkRevoked */ true)`, an
  already-open browser session for that account stops working on its very
  next request, not just on next login.
- **Tests** (`tests/unit/services/set-staff-status.test.ts`,
  `assign-roles.test.ts`): explicit `countActiveUsersWithRole` mock
  overrides prove both directions — `count = 1` blocks the operation and
  never calls the underlying repository write; `count = 2` allows it and
  still triggers `revokeRefreshTokens`/audit logging as normal. A dedicated
  test also proves the guard isn't even invoked when a target keeps
  `super_admin` (only checked on removal/deactivation, not on every call).

### Security assumptions

- **CSRF**: `/api/auth/session` and `/api/auth/forgot-password` (the only
  public, pre-auth, state-changing routes) check `Origin` against the
  request's own `Host` header (`lib/csrf.ts`) — deliberately not against
  `new URL(request.url).origin`, which under `next start` can report a
  normalized hostname that doesn't match the `Host` the client actually
  sent, which would make every legitimate request look cross-origin.
  Authenticated mutations use Server Actions, which Next.js already
  protects with its own Origin/Host check on every invocation.
- **Rate limiting now covers every server-reachable, pre-auth path** (see
  "Rate-limiting design" above) — the previous documented gap (client SDK
  calls bypassing our limiter) was closed by removing all client-side
  Firebase Auth SDK usage, not by adding a second, weaker mitigation on
  top of a still-bypassable path.

### Collections and indexes (Phase 2 additions)

All new collections are server/Admin-SDK-only — the client Firestore SDK
is never used for any of them anywhere in the app, and `firestore.rules`
denies all client access as a defense-in-depth backstop (Admin SDK bypasses
rules entirely, so the rules are documentation of intent, not the real
enforcement).

- **`users/{uid}`** — staff accounts only (customers are out of scope):
  `{ uid, email, displayName?, status: 'active'|'deactivated', roleIds:
  string[], directPermissions?: Permission[], createdAt, updatedAt,
  createdBy, lastLoginAt?, deactivatedAt?, deactivatedBy? }`. No
  denormalized `isSuperAdmin` boolean (derived from `roleIds` instead) and
  no `tokensValidAfter` field (Admin SDK tracks revocation internally).
- **`roles/{roleId}`** — `{ id, name, description, permissions:
  Permission[], isSystemRole: boolean, createdAt, updatedAt, createdBy,
  updatedBy }`. `super_admin` is the only `isSystemRole: true` row, seeded
  only by the bootstrap script.
- **`auditLogs/{autoId}`** — `{ type, actorUid, actorEmail?, targetUid?,
  metadata, createdAt }`. Append-only is enforced by
  `AuditLogRepository` exposing no update/delete method at all — not by
  Firestore rules, since Admin SDK writes bypass them.
- **`system/bootstrap`** — `{ superAdminInitialized: boolean,
  initializedAt, initializedByUid }`.
- **`rateLimits/{key}`** — `{ count, windowStartMs, expiresAt }`, ephemeral.

**Indexes** (`firestore.indexes.json`): `users` on `(status ASC, createdAt
DESC)` and `auditLogs` on `(type ASC, createdAt DESC)` — both are
equality-filter + order-by-different-field queries that need an explicit
composite index. Deploy with `firebase deploy --only firestore:indexes`
against your real project when you're ready.

**Tenant-readiness**: no `tenantId` field anywhere, per Phase 2 scope.
Collections are flat and singular today, designed so a future
`tenants/{tenantId}/...` nesting (or a `tenantId` field) could be
introduced later without a schema rewrite — not implemented now.

### Known limitations

- No automated Firestore TTL policy for `rateLimits` — one manual `gcloud`
  command, documented above, not yet run against a real project (a
  storage-hygiene cleanup item, not a security gap — see Rate-limiting
  design above).
- No super-admin demotion path — a `super_admin` role can only be added to
  an account, never removed, in Phase 2 (removal is only blocked when it
  would leave zero active super admins; a broader demotion workflow with
  re-authentication is Backlog).
- `staff:manage` is a broad, near-super-admin-trust permission (see RBAC
  model above) — a narrower split is Backlog, not yet built.
- Firebase App Check / reCAPTCHA (bot/device attestation layered on top of
  the application rate limiter) remains Backlog, as an additional future
  layer — not a substitute for the rate-limiting fix already shipped.
- Operational IAM on the real GCP project (who can run the Admin SDK or
  console actions directly) is the true boundary for audit-log
  immutability and Admin SDK access generally; this is a deployment/ops
  responsibility that no application code change can substitute for (see
  Audit-log immutability above).

## Phase 3 — Catalog and Inventory Foundation

Adds the product/variant/category/brand/inventory data model, a Firestore
transaction-backed uniqueness and stock-adjustment layer, product image
storage, and the admin UI to manage all of it — no cart, checkout, orders,
payments, shipping, customer accounts, CMS, promotions, reviews, or public
storefront yet. Every write still goes through the Admin SDK from
`services/catalog/*`, gated by RBAC, the same architecture Phase 2
established for auth.

### Catalog architecture

Same four layers as Phase 1/2, extended with a `catalog` slice at each:

```
core/catalog/            entities.ts, schemas.ts (Zod), rules.ts (pure domain functions)
core/interfaces/          product-repository.ts, category-repository.ts, brand-repository.ts,
                           inventory-repository.ts, inventory-adjustment-repository.ts,
                           product-image-storage-port.ts
infrastructure/firebase/   repositories/firestore-{product,category,brand,inventory,
                           inventory-adjustment}-repository.ts, repositories/catalog-unique-keys.ts,
                           product-image-storage.ts
services/catalog/         dependencies.ts (composition root) + one file per use case
                           (create/update/archive-product, create/update/delete-category,
                           create/update/delete-brand, adjust-inventory, upload/delete-product-image,
                           list-*, inventory-overview.ts, product-image-urls.ts)
features/catalog/         products/, categories/, brands/, inventory/ — admin UI + Server Actions
app/admin/(protected)/    products/, products/new/, products/[productId]/, categories/, brands/,
                           inventory/ — thin route composition only
```

No route, UI component, or feature imports Firestore, Firebase Admin, or
Storage directly — the same `eslint-plugin-boundaries` rule from Phase 1/2
enforces this unchanged; nothing in `eslint.config.mjs` needed to change for
Phase 3, only new files inside already-allowed directories. `services/catalog`
reuses `services/auth/session.ts`'s `requireSession()`/`requirePermission()`
directly rather than duplicating a second session mechanism.

### Product/variant model and the embedded-variants decision

A `Product` document carries every field the spec asked for directly:
name, slug, short/full description, `brandId`, `primaryCategoryId` +
`additionalCategoryIds`, a free-form `productType` string (deliberately not
a fixed enum — see below), `status` (`draft`/`active`/`archived`),
`visibility` (`visible`/`hidden`), `featured`, `sku`, optional `barcode`,
`basePrice`/`compareAtPrice`/`costPrice` (smallest currency unit, e.g.
cents — no currency or tax calculation exists, `taxClass` is a placeholder
string only), `trackInventory`/`allowBackorder`/`lowStockThreshold`,
`weightGrams`/`dimensions`, `tags`, SEO title/description, `hasVariants`,
an embedded `variants: ProductVariant[]`, an optional `attributes` bag (see
below), an embedded `images: ProductImage[]` (metadata only, never bytes —
see Image storage design), a `version` counter for optimistic concurrency,
and the usual timestamps/actor ids.

**Variants are embedded in the product document, not a separate
collection.** This was a deliberate choice, weighed against the
alternative:

- Firestore has no native cross-document uniqueness constraint and no way
  to query "does any variant across the whole catalog have SKU X" cheaply
  — that problem is solved the same way regardless of storage shape (the
  `catalogUniqueKeys` collection, see below), so splitting variants into
  their own collection wouldn't simplify uniqueness at all.
- A product's variants are always read and written together with their
  parent (the admin UI edits a product and its full variant list as one
  form; `ProductRepository.update()` needs the whole variant array to
  diff old vs. new unique-key claims in one transaction anyway). Keeping
  them in the same document means that transaction is a single-document
  read+write, not a multi-document fan-out.
- Realistic variant counts for coffee/equipment products (bag size ×
  grind, color × capacity, ...) are a handful to a few dozen, nowhere near
  Firestore's 1 MiB document limit.
- The tradeoff accepted: a product with an unusually large number of
  variants would eventually approach that document-size limit. Revisit
  with a separate `variants` collection if any product family's variant
  count grows enough to make that a real concern — not needed for Phase 3.

`ProductVariant` carries its own `id`, `sku`, optional `barcode`, price/
compare-at/cost/weight *overrides* (falling back to the parent product's
values when unset — the override fields are optional precisely so a
variant that doesn't change price doesn't need to repeat it),
`attributeSelections` (a free-form `{ [attributeName]: value }` map, e.g.
`{ bagSize: "500g", grind: "wholeBean" }` — not a fixed set of attribute
names, so the same variant model covers bag size, grind, equipment color,
voltage, or any future family's variant axis), `status`, `trackInventory`,
`allowBackorder`, and `lowStockThreshold`.

`productType` is a plain string (e.g. `"coffee_beans"`, `"grinder"`), not
an enum, and the catalog has no hardcoded list of product families anywhere
in `core/`. The families in the original scope (coffee beans, ground
coffee, capsules/pods, machines, grinders, brewers, filters, kettles,
scales, accessories, cleaning supplies) exist only as example values an
admin types into that field — adding a new family later needs zero code
changes.

### Coffee and equipment attribute strategy

Rather than flattening `roastLevel`, `originCountry`, `manufacturer`,
`voltage`, etc. directly onto every `Product` document (which would leave
equipment products with a dozen unused nullable coffee fields and vice
versa), both families' structured data live under one optional,
independently-typed `attributes` bag:

```ts
attributes?: {
  coffee?: CoffeeAttributes;     // beanType, roastLevel, originCountry, region,
                                  // farmOrProducer, processingMethod, altitudeMeters,
                                  // variety, tastingNotes, grindType, roastDate,
                                  // bestBeforeDate, netWeightGrams
  equipment?: EquipmentAttributes; // manufacturer, model, material, color, capacity,
                                    // voltage, wattage, plugType, warrantyPeriod, compatibility
}
```

Every field in both groups is optional, and the groups themselves are
independent — a coffee product simply never populates `equipment`, and
vice versa; nothing about one affects the other. Adding a future family
(say, `tea?: TeaAttributes`) means adding one more optional key to this
object, touching zero existing products. Equipment's general `weight`/
`dimensions` reuse the product-level fields rather than duplicating them a
second time inside `EquipmentAttributes` — the spec listed both, but a
product only needs one weight and one set of dimensions regardless of
family.

### Variants: uniqueness and duplicate-combination prevention

Three distinct checks, at two different layers:

1. **Duplicate SKU/barcode/attribute-combination *within one product's own
   variant list*** — `services/catalog/product-validation.ts`'s
   `validateVariantsInput()`, a pure in-memory check over the incoming
   array before any repository call. This exists as a separate layer from
   #2 below because claiming the same Firestore unique-key document twice
   for the *same* product in one transaction is a no-op, not a conflict —
   two variants with an identical SKU in the same request would otherwise
   silently both succeed.
2. **Duplicate SKU/barcode *across the whole catalog*** (a variant's SKU
   colliding with any other product's or variant's SKU/barcode) — enforced
   transactionally by the Firestore repository via `catalogUniqueKeys` (see
   below), which throws `ConflictError` on collision.
3. **Duplicate attribute *combination* within one product** (e.g. two
   variants both selecting `{ bagSize: "500g", grind: "wholeBean" }`) —
   `core/catalog/rules.ts#variantSelectionsKey()` produces an
   order-independent, case/whitespace-normalized key for a variant's
   `attributeSelections`; `hasDuplicateVariantCombination()` and the
   in-request check in `validateVariantsInput()` both use it.

### Inventory model

`InventoryRecord` is one document per `(productId, variantId | null)` pair
— `variantId: null` means a simple (no-variant) product tracked at the
product level. Fields are just `{ productId, variantId, onHand, reserved,
lowStockThreshold?, updatedAt, updatedBy }`. **`available` is deliberately
never stored** — `core/catalog/rules.ts#computeAvailableQuantity()` computes
`onHand - reserved` on every read instead. Storing a third field that's
purely a function of the other two would let it drift out of sync (an
adjustment that updates `onHand` but forgets to recompute `available`);
computing it is cheap and can never be wrong.

`InventoryAdjustment` is an append-only ledger entry: `{ inventoryId,
productId, variantId, reason, quantityDelta, onHandBefore, onHandAfter,
note?, actorId, createdAt }`. `reason` is one of the seven values the spec
listed (`initial_stock`, `stock_in`, `stock_out`, `correction`, `damaged`,
`returned`, `manual_adjustment`) — a fixed enum here, unlike `productType`,
because these are operational categories the business actually reports on,
not an open-ended taxonomy.

**`InventoryRepository.adjust()` is the only way `onHand` ever changes.**
It's a single Firestore transaction that reads the current record, checks
the backorder rule (`core/catalog/rules.ts#canDecreaseStock()` — a decrease
that would take `onHand - reserved` negative throws `ConflictError`
*unless* the product/variant's `allowBackorder` is `true`), writes the
updated record, and appends the ledger entry, all together. Concurrent
adjustments to the same record serialize through Firestore's own
transaction retry — proven by an integration test that fires 10 concurrent
`-1` adjustments at a record seeded with 100 units and asserts the final
count is exactly 90, not something less (a lost-update bug would show up
as a wrong final total, not a crash, which is why this needs a real
concurrency test against the emulator rather than a mocked one).

Order-reservation workflows (actually incrementing `reserved` when an order
is placed, releasing it on fulfillment/cancellation) are explicitly **not**
implemented in Phase 3 — only the data model (`reserved` exists as a field,
`computeAvailableQuantity()` already accounts for it) and the safe
`InventoryRepository.adjust()` seam a future orders module can call. No
UI, service, or test exercises reservation in this phase.

### Firestore model (Phase 3 collections)

All server/Admin-SDK-only, same pattern as Phase 2 — `firestore.rules`
denies all client access to every one of these as a defense-in-depth
backstop (Admin SDK bypasses rules entirely, so this documents intent, it
isn't the real enforcement; see Phase 2's Audit-log immutability section
for the same point made about IAM being the actual boundary).

- **`products/{productId}`** — see Product/variant model above. Composite
  indexes: `(status ASC, createdAt DESC)`, `(primaryCategoryId ASC,
  createdAt DESC)`, `(brandId ASC, createdAt DESC)` — one per admin-UI
  list filter, since the list view filters by exactly one of status/
  category/brand at a time, never combined.
- **`categories/{categoryId}`** — `{ name, slug, description?, parentId:
  string|null, sortOrder, isActive, imageRef?, seoTitle?, seoDescription?,
  createdAt, updatedAt, createdBy, updatedBy }`. Composite index:
  `(parentId ASC, sortOrder ASC)`. `CategoryRepository.listAll()`
  intentionally returns the whole collection un-paginated — category trees
  are admin-curated, not user-generated, so this is a safe simplification
  at Phase 3's expected size; it's what backs both the circular-reference
  walk and the admin tree UI.
- **`brands/{brandId}`** — `{ name, slug, description?, logoRef?, website?,
  isActive, seoTitle?, seoDescription?, createdAt, updatedAt, createdBy,
  updatedBy }`.
- **`inventory/{productId}:{variantId|-}`** — see Inventory model above.
  Deterministic doc id (`${productId}:${variantId ?? "-"}`) so a lookup or
  the adjust transaction never needs a query, just `.doc(id)`.
- **`inventoryAdjustments/{autoId}`** — the append-only ledger. Composite
  indexes: `(productId ASC, createdAt DESC)` and `(productId ASC, variantId
  ASC, createdAt DESC)`, matching the two ways the admin history view
  filters.
- **`catalogUniqueKeys/{type}:{value}`** — see Unique-key strategy below.

No `tenantId` field exists anywhere in Phase 3, per scope — see Future
integration seams below for how multi-tenancy could be introduced later
without a schema rewrite.

### Unique-key strategy

Firestore has no native mechanism for uniqueness across documents (a
`where` query racing against a concurrent write can't be made atomic with
that write). `catalogUniqueKeys` is the mechanism Phase 3 uses instead: one
document per claimed value, doc id `${type}:${value}` (e.g.
`product-slug:ethiopia-yirgacheffe`, `sku:ETH-YIRG-250`,
`barcode:0123456789012`, `category-slug:coffee-beans`,
`brand-slug:acme`), contents `{ type, value, ownerId, ownerKind,
createdAt }`.

- **Namespaces**: `product-slug`, `category-slug`, and `brand-slug` are
  each scoped to their own entity kind (a product and a category can share
  a slug; two products can't). `sku` and `barcode` are each one *global*
  namespace across the whole catalog — a variant's SKU can't collide with
  another product's top-level SKU either, since both are sellable-unit
  identifiers in the same real-world sense.
- **Claim/release is transactional and atomic with the document write it
  protects.** `infrastructure/firebase/repositories/catalog-unique-keys.ts`'s
  `reconcileUniqueKeys()` reads every claimed key's doc (inside the
  caller's already-open transaction), throws `ConflictError` if any is held
  by a *different* owner, then writes the claims and releases in the same
  transaction as the product/category/brand document itself —
  `FirestoreProductRepository.create()`/`update()` (and the category/brand
  equivalents) never persist a document whose slug/SKU/barcode turned out
  to be taken, because the whole thing commits or fails together.
- **Updates diff old vs. new claims** (`diffUniqueKeyClaims()`) so
  changing a product's SKU releases the old key and claims the new one in
  the same transaction, rather than leaking a permanently-reserved stale
  key. Proven by an integration test: changing a product's SKU frees the
  old one for a different new product to claim immediately after.
- **Why this shape over alternatives**: a `where("slug", "==", ...)`
  existence-check query before writing is not atomic with the write itself
  — two concurrent creates could both pass the check and then both write,
  producing a real duplicate. A dedicated collection where the *document id
  itself* is the uniqueness constraint, claimed inside the same transaction
  as the real write, is the standard Firestore pattern for this — it turns
  "check then act" into a single atomic operation.

### Transactions and concurrency

Every mutation that has a uniqueness or read-modify-write hazard runs
inside a single `db.runTransaction()`:

- **Product create/update**: claims/releases unique keys and writes the
  product document together; `update()` additionally checks
  `expectedVersion` against the document's current `version` field first,
  throwing `ConflictError` on mismatch (optimistic concurrency — two admins
  editing the same product at once get a clear "reload and try again"
  instead of one silently overwriting the other's change) and increments
  `version` on success.
- **Category/brand create/update/delete**: same unique-key transaction
  pattern, scoped to their own slug namespace.
- **Inventory adjust**: reads the current record, enforces the backorder
  rule, writes the updated record and the ledger entry together (see
  Inventory model above) — this is the one covered by a real concurrency
  integration test, not just a unit test with mocked Firestore, since
  transaction-retry-under-contention is exactly the kind of behavior a
  mock can't meaningfully fake.

### Image storage design

Product images are Firebase Storage objects; Firestore only ever stores
metadata (`ProductImage`: `id`, `storagePath`, `contentType`, `sizeBytes`,
`altText`, `sortOrder`, `isPrimary`, `uploadedAt`, `uploadedBy`) — never
image bytes, never base64, and never a long-lived public URL persisted
anywhere.

- **Server-generated paths only.** `products/{productId}/{imageId}.{ext}`
  is built entirely from the product's own id, a server-generated random
  image id, and a fixed extension derived from the validated content type
  (`infrastructure/firebase/product-image-storage.ts#buildStoragePath()`)
  — there is no code path anywhere that accepts a path or filename from the
  caller, which is what makes "no user-controlled arbitrary paths" hold.
- **Validation happens before any byte reaches Storage.**
  `services/catalog/upload-product-image.ts` only trusts `bytes.byteLength`
  (what was actually received), never a caller-claimed `sizeBytes` — a lie
  about size can't smuggle an oversized upload past the 5MB limit. Content
  type is restricted to `image/jpeg`, `image/png`, `image/webp` via a fixed
  Zod enum (`PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES`).
- **Admin preview uses Firebase Storage "download tokens", not
  cryptographically signed GCS URLs.** This was a deliberate correction made
  during Phase 3, not the original design: a GCS signed URL
  (`file.getSignedUrl()`) requires the calling identity to hold
  `iam.serviceAccounts.signBlob` on itself — an IAM grant beyond plain
  Application Default Credentials, with no equivalent at all against the
  Storage emulator (which has no real IAM to check — it fails with "Could
  not load the default credentials", not a rules error). Firebase's
  download-token mechanism (a random token stored in the object's custom
  metadata, embedded in the URL as `?alt=media&token=...`) works
  identically via the Admin SDK in both production and the emulator, with
  zero extra IAM configuration required of whoever deploys this. The
  tradeoff: unlike a signed URL, a download token does not expire on its
  own — anyone who obtains the URL can view that image indefinitely until
  the token is rotated (rotation isn't implemented). For Phase 3's
  admin-only product photography — no customer PII, no public storefront
  yet — this is an accepted tradeoff; revisit if these URLs are ever
  exposed anywhere less controlled than the admin UI.
- **Delete order matters.** `deleteProductImage()` removes the image from
  the product's Firestore metadata *first*, then deletes the Storage
  object. That order (not the reverse) means a failure partway through
  leaves at worst an unreferenced orphan file in the bucket (harmless,
  nothing points to it) — never a product still listing an image whose
  bytes are already gone. The same logic runs in reverse for a *failed*
  upload: if the Storage write succeeds but the Firestore metadata update
  fails (e.g. a concurrent edit bumped the product's `version`), the
  just-uploaded object is deleted rather than left orphaned
  (`upload-product-image.ts`'s `catch` block).
- **`storage.rules`** denies all direct client access to
  `products/{productId}/{imageFile}` (and everything else) — there is no
  client-side Firebase Storage SDK usage anywhere in this app; every
  upload/delete/preview goes through an Admin-SDK-mediated Server Action
  gated by `requirePermission(actor, "products:edit")` first. Like
  Firestore rules, this is defense-in-depth, not the primary boundary — see
  the rules file's own comment for the parallel to Phase 2's Firestore
  rules.

### RBAC permissions

Reuses the `products`, `categories`, `brands`, `inventory` namespaces
Phase 2 already reserved (`core/auth/permissions.ts`'s
`PERMISSION_NAMESPACES`) — Phase 3 activates them for the first time, adds
no new namespace. One new **action** was added: `adjust`, alongside the
existing `view`/`create`/`edit`/`delete`/`export`/`manage`. Inventory
adjustment is a distinct, more sensitive action than editing a product's
descriptive fields, so `inventory:adjust` can be granted to a role
independently of `inventory:edit` — the `manage` wildcard still covers it
like every other action in a namespace, and `super_admin` still bypasses
every check unconditionally, unchanged from Phase 2.

Activated permissions: `products:view/create/edit/delete`,
`categories:view/create/edit/delete`, `brands:view/create/edit/delete`,
`inventory:view`, `inventory:adjust`. Product image upload/delete are
gated behind `products:edit` (images are a facet of editing a product, not
a separate namespace the spec's permission list didn't ask for).

The admin nav (`features/admin-shell/components/admin-nav.tsx`) shows
Products/Categories/Brands/Inventory links only when the session holds the
matching `:view` permission — UX only, exactly like Phase 2's Staff/Roles
links; every page and Server Action independently calls
`requirePermission()` regardless of what the nav renders.

Category and brand editing happens in-place on `/admin/categories` and
`/admin/brands` (client-side state toggling the same form between create
and edit) rather than a `/admin/categories/[id]` or `/admin/brands/[id]`
route — the Phase 3 admin route list is deliberately just the six routes
named in scope (`/admin/products`, `/admin/products/new`,
`/admin/products/[productId]`, `/admin/categories`, `/admin/brands`,
`/admin/inventory`), and an edit form doesn't need its own route when it
already renders on the page that lists everything.

### Deletion policy

- **Products are never hard-deleted** — `archiveProduct()` only ever sets
  `status: "archived"` (still gated behind `products:delete`, since it's
  the operation that removes a product from the active catalog, even
  though it's a status change rather than a document delete).
- **Categories and brands in use cannot be deleted.**
  `deleteCategory()`/`deleteBrand()` check `ProductRepository.countByCategory()`/
  `countByBrand()` first and throw `ForbiddenError` if any product
  references them (a category also can't be deleted while it has
  subcategories). Only a genuinely unused category/brand reaches
  `repository.delete()`, which also releases its slug from
  `catalogUniqueKeys` so the slug becomes available again.
- **A product's `additionalCategoryIds` can never repeat its own
  `primaryCategoryId`** (`assertNoDuplicateCategoryAssignment()`) — besides
  being a redundant assignment, it would let `countByCategory()`'s two
  separate `count()` queries (Firestore has no single query expressing
  "primaryCategoryId == X OR additionalCategoryIds contains X" with an
  aggregate count) double-count the same product.
- **Image cleanup**: deleting an image removes it from the product's
  metadata and its Storage object (see Image storage design above); an
  image belonging to a deleted-but-previously-unused category/brand has no
  separate cleanup path in Phase 3, since categories/brands don't own
  Storage objects — only their `imageRef`/`logoRef` string fields, which
  are just placeholders for a future asset-picker feature, not yet wired
  to Storage themselves.
- **Audit events**: `product_created`, `product_updated`,
  `product_archived`, `category_created/updated/deleted`,
  `brand_created/updated/deleted`, `product_image_uploaded/deleted`,
  `inventory_adjusted` — all recorded the same way Phase 2 established:
  `actorUid`/`actorEmail` from the verified session, never from request
  input, via the same append-only `AuditLogRepository` port (no new port
  needed — Phase 3 reuses it directly).

### Emulator setup (Phase 3 additions)

```bash
pnpm run test:integration    # now starts firestore, auth, AND storage (was firestore, auth only)
pnpm run test:e2e:auth       # now runs tests/e2e/auth.spec.ts AND tests/e2e/catalog.spec.ts
```

The Storage emulator was added to `test:integration`'s `firebase
emulators:exec --only` list specifically for
`tests/integration/product-image-storage.test.ts`. The Admin SDK Storage
client needs `FIREBASE_STORAGE_EMULATOR_HOST` (added to `apps/web/.env.test`)
to talk to the emulator — unlike Firestore/Auth, this isn't inferred from
`NEXT_PUBLIC_USE_FIREBASE_EMULATORS` alone.
`playwright.auth.config.ts`'s `testMatch` now includes both
`auth.spec.ts` and `catalog.spec.ts`, since both need the same
Firestore+Auth-backed login flow and fixture accounts from
`global-setup.ts` — the Phase 2 super-admin fixture already has every
`{namespace}:manage` permission (`allManagePermissions()`), so it needs no
changes to also cover the catalog namespaces.

### Test totals (Phase 3 additions)

- Unit: catalog domain rules (`catalog-rules.test.ts`), variant/category
  validation, and one test file per service use case (create/update/
  archive product, create/update/delete category, create/update/delete
  brand, adjust inventory, upload/delete product image) — all with mocked
  `CatalogDeps`, no emulator.
- Integration (real emulator): Firestore product/category/brand/inventory
  repository adapters (including slug/SKU/barcode conflict tests, the
  optimistic-concurrency version check, and the SKU-release-on-change
  test), the concurrent-inventory-adjustment test, the Storage adapter
  (upload/delete/download-token tests), and the Phase 3
  `firestore.rules` denial tests.
- Playwright: `tests/e2e/catalog.spec.ts` — one ordered flow (create
  category → brand → product → adjust inventory → archive) as the super
  admin, plus permission-denial and nav-visibility checks for a
  no-permission staff account.

See the final verification report for exact current pass counts.

### Known limitations (Phase 3)

- Order-reservation workflows are not implemented — only the data model
  (`reserved` field, `computeAvailableQuantity()`) and the
  `InventoryRepository.adjust()` seam exist for a future orders module to
  build on.
- Product image download-token URLs do not expire on their own (see Image
  storage design above) — acceptable for admin-only photography today, not
  suitable as-is if these URLs were ever exposed somewhere less controlled.
- `CategoryRepository.listAll()` and `InventoryRepository.listLowStock()`
  both read their entire collection (bounded to 2000 for low-stock)
  un-paginated — a reasonable simplification at Phase 3's expected catalog
  size, revisit if either collection grows enough to matter.
- No tax calculation, currency conversion, or pricing-rule engine —
  `basePrice`/`compareAtPrice`/`costPrice` are plain numbers in the
  smallest currency unit, and `taxClass` is a placeholder string with no
  behavior behind it.
- Clearing an optional field back to "unset" (rather than replacing it with
  a new value) is only explicitly supported for `barcode` (via
  `FieldValue.delete()`); other optional string/number fields follow the
  same convention Phase 2 already established (blank the value via an
  empty string/0 from the form; a key simply omitted from a patch means
  "unchanged", not "clear").
- No image reordering drag-and-drop in the admin UI yet — `sortOrder` exists
  on `ProductImage` and is respected on render, but is only ever set at
  upload time (append to the end), not editable afterward.

### Future integration seams for orders, POS, ERP, wholesale, and multi-tenant support

- **Orders**: `InventoryRepository.adjust()` already exists as the one
  transactional stock-mutation seam; an orders module's checkout flow would
  call it with `reason: "stock_out"` (or extend the reason enum with an
  order-specific value) and use the existing `reserved` field for
  hold-during-checkout semantics, which `computeAvailableQuantity()`
  already accounts for everywhere it's read.
- **POS**: the same `adjust()` seam and `InventoryAdjustment` ledger would
  serve a point-of-sale integration identically — POS-originated
  adjustments are just another `actorId`/`reason` on the same append-only
  ledger, no new data model needed.
- **ERP/wholesale**: `Product.costPrice` and the `taxClass` placeholder are
  already present for a future ERP sync or wholesale pricing tier to read
  from; a wholesale price-list feature would most naturally add its own
  collection referencing `productId`/`variantId` rather than growing the
  `Product` document further.
- **Multi-tenant**: no `tenantId` field exists anywhere in Phase 3,
  matching the explicit scope instruction. Every Phase 3 collection is
  flat and singular today, designed so a future `tenants/{tenantId}/...`
  nesting (or a `tenantId` field plus composite indexes including it)
  could be introduced later without a schema rewrite — the same
  tenant-readiness posture Phase 2 documented for its own collections, not
  yet implemented, not pretended to be implemented.

## Phase 4 — Public Storefront, Search, and Product Discovery

Adds the customer-facing storefront on top of Phase 3's catalog: a
homepage, product listing with filters/sort/pagination, product detail
with variant selection, Firestore-backed search, and SEO metadata/
structured data — no cart, checkout, orders, payments, shipping, customer
accounts, wishlist, reviews, coupons, CMS editor, or admin redesign yet.
Every storefront page is read-only against Phase 3's existing catalog
data; nothing in this phase writes to Firestore.

### Storefront architecture

Same layering as Phase 1–3, with a `storefront` slice alongside `catalog`
at each layer:

```
core/storefront/           dto.ts (public DTOs), rules.ts (visibility/availability/variant
                            logic), schemas.ts (Zod query validation), structured-data.ts
                            (pure JSON-LD builders)
core/catalog/               rules.ts extended (additive) with buildSearchTokens/tokenizeQuery/
                            matchesAllQueryWords; entities.ts extended with Product.searchTokens
core/interfaces/            public-product-repository.ts, public-category-repository.ts,
                            public-brand-repository.ts, public-inventory-availability-port.ts
infrastructure/firebase/    repositories/firestore-public-{product,category,brand}-repository.ts,
                            repositories/firestore-public-inventory-availability.ts
services/storefront/        dependencies.ts (composition root), cache.ts (unstable_cache wrapper +
                            revalidateStorefrontTag), seo.ts (Metadata builders), get-product.ts,
                            get-category.ts, get-brand.ts, list-products.ts, list-featured.ts,
                            list-new-arrivals.ts, list-related-products.ts, search-products.ts
features/storefront/        shared/ (ProductCard, ProductImage, PriceDisplay, AvailabilityBadge,
                            Breadcrumbs, StructuredData, HighlightText, empty/skeleton/error states),
                            home/, listing/, detail/, search/ — presentational components that
                            receive already-fetched data as props
app/(storefront)/           layout.tsx (Header/Footer shell) + page.tsx, products/, products/[slug]/,
                            categories/[slug]/, brands/[slug]/, search/ — thin route composition:
                            parse/validate searchParams, call services/storefront/*, pass results
                            to features/storefront/* components
app/sitemap.ts, app/robots.ts
```

No UI component imports Firebase directly — the same `eslint-plugin-boundaries`
rule enforces this unchanged, and the existing `architecture-boundaries.test.ts`
regression test covers the new directories too. `services/storefront/*`
never imports `services/catalog/*` or vice versa; the only file Phase 4
modifies inside Phase 3's own layers is additive (`searchTokens` on
`Product`, and cache-invalidation calls inside `features/catalog/*/actions.ts`
— see Cache strategy below), never a redesign of Phase 1–3's architecture.

### Public read model and security boundary

`core/storefront/dto.ts` defines `PublicProduct`, `PublicProductSummary`,
`PublicCategory`, and `PublicBrand` as **entirely separate types** from the
admin `Product`/`Category`/`Brand` entities — not a `Pick<>`/`Omit<>` of
them. That's a deliberate structural choice: adding a new field to the
admin `Product` entity does nothing to the public DTO until someone
deliberately adds it there too, so a future admin-only field (internal
notes, cost price, an audit trail) can never leak to the browser by
accident.

Every method on every public repository (`FirestorePublicProductRepository`,
`FirestorePublicCategoryRepository`, `FirestorePublicBrandRepository`) bakes
its own visibility filter into the Firestore query itself — `status ==
"active" && visibility == "visible"` for products, `isActive == true` for
categories/brands — rather than filtering client-side after the fact. This
applies identically to keyed lookups (`findBySlug`), not just list queries:
there is no code path on the public port that can return a draft, archived,
or hidden product under any circumstance. `getProductBySlug`/
`getCategoryBySlug`/`getBrandBySlug` return `null` identically for "never
existed," "exists but is a draft," and "exists but hidden" — deliberately
indistinguishable from the outside, which is what prevents an unpublished
slug from being enumerated by probing.

Fields deliberately never exposed: `costPrice`, internal notes, the
inventory adjustment ledger (only the derived `inStock`/`lowStock`
booleans are ever returned — see Availability below), and `barcode` (never
populated on `PublicProduct` in Phase 4, since there's no per-product "safe
to show publicly" flag yet to key that decision on; a future toggle would
slot in without a DTO shape change).

**Availability** (`PublicAvailability = { inStock, lowStock }`) is computed
by `FirestorePublicInventoryAvailability`, a read-only adapter over the
same `inventory` collection Phase 3's admin repository writes, batched via
`Firestore.getAll()` so a listing page's N products cost one round trip,
not N. A listing card checks only the *first* variant as a representative
signal (bounding read cost per card); the product detail page checks every
variant individually and aggregates ("in stock if any variant is, low
stock if any in-stock variant is individually low"). This asymmetry is a
documented tradeoff, not an oversight — see Known limitations.

If a product's primary category or brand is deactivated after the product
was published, the product doesn't disappear or throw: it falls back to a
generic `{ name: "Uncategorized", slug: categoryId }` ref. Deactivating a
category/brand is deliberately non-cascading in Phase 4.

### Filters, pagination, and query validation

`core/storefront/schemas.ts`'s `listProductsQuerySchema` (Zod) validates
every `/products`, `/categories/[slug]`, and `/brands/[slug]` query
string before it reaches a repository — the same discipline Phase 2/3
applied to request bodies, since a query string is untrusted input anyone
can type or share. A query that fails validation degrades to "no filters"
rather than 500ing the page (`features/storefront/listing/parse-search-params.ts`).

`PublicProductRepository.list()` pushes down **at most one** equality
filter to Firestore — category, then brand, then productType, then
featured, in that priority order — plus a fixed sort. This is the
deliberate, documented reason Phase 4 needs only 34 total composite
indexes (25 new) instead of one per every possible filter *combination*:
every other requested filter dimension (price range, availability, and
any non-primary filter) is applied by `services/storefront/list-products.ts`
as an in-memory refinement over the bounded page the primary filter
already returned. The tradeoff is explicit and shown in the code's own
comments: a heavily-filtered request can return fewer than `limit` items
even when more matches exist on the next page. This never means an
unbounded scan — the Firestore query itself is always capped at `limit`
(≤ 60), never the whole catalog.

Pagination is cursor-based (`nextCursor`, an opaque Firestore document
id), not page-numbered — `features/storefront/listing/query-utils.ts`
maintains a small cursor-history stack encoded in the URL (`cursor` +
comma-joined `cursors`) so "Previous" can walk backwards without needing
numbered pages, entirely via plain `<Link>`s (no client JS required for
pagination itself).

### Search strategy

No paid external search provider exists in Phase 4. Search works by
denormalizing a `searchTokens: string[]` field onto `Product` (computed in
`core/catalog/rules.ts`'s `buildSearchTokens()`, called from
`services/catalog/create-product.ts`/`update-product.ts`): every word
≥ 2 characters from the name, product type, brand name, category name, and
tags is expanded into every prefix ≥ 2 characters long (Unicode-aware —
NFKD-normalized and diacritic-stripped via `\p{M}`), plus the exact
lowercased SKU/barcode and variant SKUs as whole tokens, capped at 300
tokens/product.

A search query's **longest word** (the most selective, smallest candidate
set) becomes the one Firestore-indexed `array-contains` filter
(`searchTokens array-contains primaryToken`, bounded and cursor-paginated,
capped at `limit`); every other query word is checked via in-memory
substring matching (`matchesAllQueryWords`) against that same bounded page
only — never a second Firestore query, never a full-catalog scan. A
multi-word query can therefore return fewer results than technically
match the full catalog; this is the same documented tradeoff as the
listing filters above, not a bug.

Result highlighting (`features/storefront/shared/highlight-text.tsx`)
wraps matching words in `<mark>` on a best-effort basis — it re-matches
the query against the rendered name client-side, independent of (and not
a substitute for) the actual token-matching logic above.

**Known limitation, stated plainly**: this is prefix/substring matching,
not relevance ranking, fuzzy matching, or typo tolerance. The seam for a
real external engine (Algolia, Typesense, Meilisearch) is
`core/interfaces/public-product-repository.ts`'s `searchByToken()` method
— swapping the Firestore implementation for an HTTP call to an external
index requires no change to `services/storefront/search-products.ts`'s
caller-facing contract.

### Cache and revalidation strategy

`services/storefront/cache.ts` wraps every storefront read with Next's
`unstable_cache`, tagged with one of three **coarse, entity-kind-level**
tags (`storefront:products`, `storefront:categories`, `storefront:brands`
— not per-slug, since `unstable_cache`'s `tags` option is static per
wrapped function, and per-slug tags would need a freshly-constructed
wrapped function per slug). `revalidateTag(tag, "max")` invalidates every
cached read for that entire tag at once — coarser than surgical, a
deliberate simplification for Phase 4's expected scale. A 300-second
safety-net `revalidate` window bounds staleness even if an invalidation
call is ever missed, including for cached availability data (a storefront
*display* signal only — nothing here reserves or mutates stock, so a few
minutes of staleness on "in stock" text is an accepted cost the same way
most storefronts accept it).

`revalidateStorefrontTag()` calls are wired into the existing Phase 3
admin Server Actions (`features/catalog/{products,categories,brands,inventory}/actions.ts`),
not into `services/catalog/*` — an admin mutation still lives entirely in
Phase 3's own layer; Phase 4 only adds one extra call per action so the
next storefront read for that tag never serves stale data.

Every `services/storefront/*` function accepts an optional `deps`
parameter defaulting to `defaultStorefrontDeps`; each function checks
`deps === defaultStorefrontDeps` by reference to decide whether to route
through the cached wrapper (production, real Firestore) or call the plain
uncached function directly (unit tests with injected mocks, and
integration tests that want real Firestore *without* invoking
`unstable_cache` — see Testing below for why that distinction matters).

**A real gotcha, documented for whoever runs this locally next**: Next's
Data Cache in a self-hosted `next start` deployment is a *filesystem*
cache under `.next/cache/`, not purely in-memory — `next build` does not
clear it. Rebuilding against a *different* Firestore emulator dataset
(e.g. re-running `test:e2e:auth` locally without clearing `.next`) can
serve cached reads from a previous, now-gone dataset. `playwright.auth.config.ts`
guards against exactly this by clearing `.next/cache` and forcing a fresh
server process before every run; a production deployment doesn't hit this
because it's built once against its own real data.

### Variant selection

`features/storefront/detail/variant-selector.tsx` and
`resolve-variant-selection.ts` implement selection entirely as URL state —
every option renders as a plain `<Link>` (no JavaScript required) to a URL
that already encodes the resulting selection, which is what makes a
variant combination shareable/bookmarkable. `core/storefront/rules.ts`'s
`getAvailableAttributeValues()` computes, for each attribute, exactly
which values are still reachable given every *other* currently-selected
attribute; a value that wouldn't form a real variant combination renders
as inert, struck-through text rather than a clickable link — a shopper can
never navigate to an invalid combination. Selecting a full valid
combination updates price, SKU, weight, and availability to that variant's
own values; an incomplete or invalid combination falls back to the
product's own base price and a "select options" prompt. **Nothing here
reserves or mutates inventory** — the "Add to cart" button
(`purchase-placeholder.tsx`) is permanently disabled and labeled "coming
in a future update."

### Images

`next.config.ts` conditionally allows two remote patterns, both pinned to
this project's own Storage bucket path (`/v0/b/<bucket>/o/**`, never a
wildcard host): the production `https://firebasestorage.googleapis.com`
host always, and — only when `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` —
the Storage emulator's own plain-HTTP host, parsed from
`FIREBASE_STORAGE_EMULATOR_HOST`. Without this second pattern, `next/image`
would reject every emulator-served image as an unconfigured remote host,
breaking local dev and the e2e suite. `features/storefront/shared/product-image.tsx`
wraps `next/image` with a broken-image/missing-image fallback (a decorative,
`aria-hidden` icon inside a `role="img"`-labeled container) and requires
its parent to provide `position: relative` plus a fixed aspect ratio, so a
missing or slow-loading image never causes layout shift.

### SEO

`services/storefront/seo.ts` builds Next's `Metadata` (title, description,
canonical URL, Open Graph) for every storefront page from the same public
DTOs the page itself renders — `seoTitle`/`seoDescription` when an admin
set them, falling back to the entity's own name/description otherwise.
`core/storefront/structured-data.ts` builds schema.org JSON-LD (`Product`
with an `Offer` reflecting the product's own base price/aggregate
availability — not a client-selected variant, since this is generated
once per page load — and `BreadcrumbList`), rendered via
`features/storefront/shared/structured-data.tsx`. `app/robots.ts`
disallows `/admin` and `/api`, points at `/sitemap.xml`. `app/sitemap.ts`
includes every active category and brand, plus the 60 most-recently-created
products (`listProductsQuerySchema`'s own `limit` cap) — **a bounded
sitemap, not the full catalog**, documented in Known limitations rather
than silently truncated.

Every storefront page under `app/(storefront)/` is `export const dynamic
= "force-dynamic"` — none of them can be statically prerendered at build
time, since they read Firestore via the Admin SDK, which needs Application
Default Credentials a build step doesn't have (and shouldn't need — catalog
data changes independently of deploys). The actual read cost is still
bounded by the cache strategy above, not by static generation.

### Accessibility

Semantic landmarks (`<header role=banner>`, `<main>`, `<footer role=contentinfo>`,
`<nav aria-label="Primary">`/`"Breadcrumb"`/`"Pagination"`); every dialog
(mobile nav, mobile filter drawer) is a Radix `Dialog` with correct focus
trapping/`Escape`-to-close for free; every form control has a real
`<label>` (explicit `htmlFor` or implicit wrapping); breadcrumbs mark the
current page with `aria-current="page"`; decorative icons (the broken-image
fallback, chevrons) are `aria-hidden`; availability/price are
screen-reader-readable plain text, never color-only. Not done: an
automated axe-core scan (the e2e suite's accessibility checks are targeted
role/label/alt-text assertions, not a full automated audit) and explicit
`prefers-reduced-motion` handling beyond what Radix's own primitives
already provide — both noted in Known limitations.

### Security summary

- Only `status: "active"` + `visibility: "visible"` products, and
  `isActive: true` categories/brands, are ever returned by any public
  repository method, including keyed lookups — enforced at the Firestore
  query level, not filtered after the fact.
- `costPrice`, internal notes, and the inventory adjustment ledger are
  structurally impossible to expose — the public DTOs don't have fields
  for them.
- `barcode` is never populated on the public product DTO.
- Every `/products`, `/categories/[slug]`, `/brands/[slug]`, and `/search`
  query string is validated with Zod before touching a repository; a
  malformed query degrades to "no filters" rather than erroring.
- `getProductBySlug`/`getCategoryBySlug`/`getBrandBySlug` return `null`
  identically for "never existed" and "exists but unpublished," preventing
  slug enumeration.
- No public component or route imports Firebase/Firestore directly; all
  reads go through `services/storefront/*`, enforced by the same
  `eslint-plugin-boundaries` rule as every other phase.
- `firestore.rules`/`storage.rules` are unchanged — still deny-all for
  every client, since the storefront never reads Firestore from the
  browser.

### Testing

- **Unit** (87 new tests, `pnpm test`, mocked ports/no emulator):
  `core/storefront/rules.ts` (visibility, availability, variant-matching,
  price/availability filters, related-product selection), search-token
  generation and query tokenization (`core/catalog/rules.ts`), Zod query
  schemas, `resolve-variant-selection.ts`, the pagination/filter
  query-string helpers, SEO metadata builders, JSON-LD builders, and
  `withStorefrontCache`/`revalidateStorefrontTag`'s `next/cache` wiring
  (mocked, since `unstable_cache` genuinely throws outside a real Next.js
  request context — confirmed empirically, see Known limitations).
- **Integration** (25 new tests, `pnpm run test:integration`, Firebase
  Emulator Suite): every public repository's visibility security (draft/
  archived/hidden/inactive entities are never returned, by any method,
  including keyed lookups), availability computation against real
  inventory records, and an end-to-end services-layer pass (bypassing the
  cached entry point via a spread-copy of `defaultStorefrontDeps`, since
  `unstable_cache` can't run outside a real server) proving the same
  security holds through `listProducts`/`getProductBySlug`/`searchProducts`.
- **Playwright e2e** (21 new tests, `pnpm run test:e2e:auth`): homepage
  structure, product listing with category/featured filters and grid/list
  toggle, search (results, highlighting, min-length prompt, generic empty
  state), product detail (price/SKU/breadcrumb/disabled purchase
  placeholder, JSON-LD present), variant selection (price/SKU update,
  invalid combinations blocked), hidden/draft/inactive-entity denial (each
  404s the same way as a never-existed slug), mobile hamburger nav and
  filter drawer, and accessibility smoke checks (accessible image names,
  breadcrumb `aria-current`). Fixtures are seeded through the real admin
  repositories directly (not the admin UI) — the admin variant editor's
  inputs aren't `htmlFor`-associated with their labels (fragile to drive
  through Playwright, and not what this suite is testing anyway), and
  driving every fixture through a login would compete with `auth.spec.ts`/
  `catalog.spec.ts` for the same per-IP login rate limit (a real
  production safety limit never weakened for tests).

### Known limitations

- Search is prefix/substring matching over denormalized tokens, not
  relevance-ranked, fuzzy, or typo-tolerant — see Search strategy's
  external-engine seam.
- Filters/search beyond the one Firestore-indexed primary filter are
  applied in-memory over a bounded page, which can return fewer than
  `limit` results even when more matches exist — a documented, deliberate
  tradeoff, not a bug.
- `barcode` is never exposed on the public product DTO in Phase 4 — no
  per-product "safe to show" flag exists yet to key that decision on.
- Listing cards check only the first variant for availability (a
  representative signal); only the product detail page aggregates across
  every variant.
- Cache invalidation is coarse (entity-kind-level tags, not per-slug) and
  bounded by a 300-second safety net even if a tag invalidation is missed.
- Deactivating a category/brand doesn't cascade to hide its products —
  they fall back to a generic "Uncategorized" reference instead.
- The sitemap includes every active category/brand but only the 60
  most-recently-created products, not the full catalog.
- Currency is hardcoded to USD (`lib/format.ts`) — no real currency/locale
  handling exists yet.
- No automated accessibility audit (axe-core or similar) — only targeted
  role/label/alt-text assertions in the e2e suite.
- Next's `unstable_cache` cannot be exercised in a plain Vitest/Node
  process (confirmed empirically: it throws `Invariant: incrementalCache
  missing` outside a real Next.js server request) — its tag/revalidate
  wiring is unit-tested with a mocked `next/cache` instead of a true
  integration test against the real cache implementation.

### Future integration seams

- **External search**: `PublicProductRepository.searchByToken()` is the
  one method to replace with an HTTP call to Algolia/Typesense/Meilisearch;
  `services/storefront/search-products.ts`'s own contract wouldn't change.
- **Cart/checkout**: `purchase-placeholder.tsx` is the one component to
  replace; variant resolution (`resolve-variant-selection.ts`) already
  produces the exact variant id/SKU/price a cart line item would need.
  Phase 3's `InventoryRepository.adjust()` remains the one transactional
  stock-mutation seam a checkout flow would call into.
- **Per-slug cache invalidation**: if Phase 4's coarse, entity-kind-level
  tags stop being precise enough at scale, `withStorefrontCache` would
  need per-slug tag construction (a wrapped-function-per-slug, or a
  different cache primitive) — noted, not built.

## Phase 5 — Cart, Checkout, Delivery, Pickup, Payments, and Order Creation

Adds the transactional core the storefront was missing: a guest cart,
server-validated checkout, Bahrain delivery/pickup scheduling, cash and Tap
card payments, inventory reservation (the "previously deferred" workflow
Phase 3 modeled but never wired up), order creation, and public order
tracking. No customer accounts, wishlist, reviews, CMS editor, advanced
promotions/coupons, refund execution, ERP sync, POS, or wholesale — those
stay Backlog. `purchase-placeholder.tsx`, Phase 4's disabled "Add to cart"
button, is gone, replaced by a real, working one.

### Architecture

Same layering as every prior phase, with new slices at each layer:

```
core/money/                money.ts — Money value object (integer minor units, never a float)
core/shipping/              rules.ts — Bahrain tier fee + free-shipping upsell (single-sourced)
core/cart/                  entities.ts, rules.ts — CartLine/Cart, priceCart (server-rebuilt pricing)
core/customer/               phone.ts (Bahrain mobile), email.ts
core/delivery/               entities.ts (DeliveryAddress/PickupSelection/FulfillmentSchedule),
                              rules.ts (country/address validation)
core/scheduling/              rules.ts — fixed time-window slots, cutoff/capacity seams
core/payments/                entities.ts — Payment, PaymentWebhookEvent, status unions
core/orders/                  entities.ts (Order/OrderLine/OrderStatusEvent), rules.ts (order
                              number generation, buildOrderLinesFromPricedCart, status transitions),
                              public-view.ts (redacted PublicOrderView for tracking)
core/email/                   templates.ts — pure render functions, one per EmailTemplate
core/interfaces/               cart-repository.ts, order-repository.ts, payment-repository.ts,
                              payment-provider-port.ts, inventory-reservation-repository.ts,
                              idempotency-repository.ts, email-port.ts, email-outbox-repository.ts
infrastructure/firebase/        money-mapping.ts, repositories/firestore-{cart,order,order-event,
                              payment,payment-webhook-event,inventory-reservation,idempotency,
                              email-outbox}-repository.ts
infrastructure/payments/tap/    env.ts, tap-payment-provider.ts, fake-tap-provider.ts
infrastructure/email/           console-email-provider.ts
services/cart/                  dependencies.ts, cart-session.ts (signed cookie), cart-store.ts,
                              catalog-snapshot.ts, get-priced-cart.ts, add/update/remove/clear-cart.ts
services/inventory/             dependencies.ts, reservations.ts — reserve/release/commitOrderReservations
services/payments/              dependencies.ts, create-payment.ts, handle-tap-webhook.ts,
                              confirm-cash-payment.ts
services/checkout/               dependencies.ts, validation.ts, create-order.ts — the one
                              checkout/order-creation use case
services/orders/                 dependencies.ts, track-order.ts — public order tracking
services/email/                  dependencies.ts, send-transactional-email.ts (outbox + best-effort send)
services/rate-limiting/         default-rate-limiter.ts — shared instance for storefront actions
config/                          cart.ts, inventory.ts, pickup.ts, rate-limits.ts
features/cart/                  actions.ts (Server Actions), components/ (AddToCartButton,
                              CartLineRow, CartSummary)
features/checkout/               actions.ts, checkout-form.tsx
features/tracking/               actions.ts, order-lookup-form.tsx (shared by /orders/track and
                              /checkout/success)
app/(storefront)/cart/, checkout/, checkout/success/, orders/track/
app/api/payments/tap/webhook/route.ts
app/api/admin/orders/[orderId]/confirm-cash-payment/route.ts
```

No UI or route imports Firebase Admin, Firestore, or the Tap SDK/HTTP API
directly — `features/*` and `app/*` only ever call `services/*`, which is
the same boundary `eslint-plugin-boundaries` has enforced since Phase 1.
`services/checkout/*` composes `services/cart/*`, `services/inventory/*`,
`services/payments/*`, and `services/email/*` rather than re-implementing
any of them, so each area's own composition root stays the one place its
own wiring changes.

### Cart architecture

A `CartLine` stored in Firestore carries only client-controllable fields —
`{ id, productId, variantId, quantity, addedAt }` — nothing else. Every
read or mutation rebuilds a `CartLineCatalogSnapshot` (name, SKU, image,
price, availability, `allowBackorder`, `trackInventory`) from **live**
catalog/inventory data via `buildCatalogSnapshots`; nothing about price,
name, or availability is ever trusted from what's stored on the cart
itself or from anything the browser submits. `core/cart/rules.ts#priceCart`
is the one function that combines a cart's lines with these snapshots into
a `PricedCart` — the same function the cart page, the cart drawer summary,
and checkout's own revalidation step all call, so there is exactly one
place subtotal/shipping/upsell/grand-total math happens.

Cart validation deliberately uses the **admin** `ProductRepository`/
`InventoryRepository` (full data, including `allowBackorder` and exact
stock), not Phase 4's redacted public storefront DTOs — those DTOs
intentionally hide operational detail for what the browser sees on a
product page, but cart pricing is a privileged, server-only computation
that needs the real numbers to build *this shopper's own* cart response.

**Persistence**: the guest cart cookie (`__Host-cart-id`) is `{cartId}.{hmacSignature}`
(`lib/cart-cookie.ts`), signed — not encrypted — because it carries only an
unforgeable id, never the cart's actual contents; those live server-side in
the `carts` Firestore collection, keyed by that id. 30-day expiry
(`config/cart.ts`). No sensitive data is ever written to `localStorage`. A
cart id that doesn't resolve to any stored document (new visitor, or an
expired/never-created cart) returns an in-memory empty `Cart` without a
Firestore write — a write only happens on an actual mutation (add/update/
remove/clear), never from a plain read/browse. A future authenticated-
customer cart-merge (guest cart → account cart on login) is a seam this
`CartRepository`/cookie design leaves open, not something built now.

### Money and Bahrain shipping rules

`core/money/money.ts`'s `Money` is `{ amount: number, currency: CurrencyCode }`
where `amount` is always **integer minor units** (fils; `BHD.minorUnitsPerMajor
= 1000`, `decimalDigits: 3`) — every arithmetic helper (`add`, `subtract`,
`multiply`, `sum`, comparisons) operates on integers, so there is no
floating-point currency math anywhere in the codebase. `ACTIVE_CURRENCY` is
`BHD`; a future multi-currency phase would extend `CurrencyCode` and
`CurrencyDefinition` rather than redesign `Money` itself. No hardcoded USD
remains in the checkout flow — the storefront-wide currency formatter is
Phase 4's own concern and untouched here.

`core/shipping/rules.ts`'s tiers, exactly as specified, with **strict**
(`>`, never `≥`) boundaries:

| Subtotal | Shipping fee |
| --- | --- |
| ≤ BHD 10.000 | BHD 2.000 |
| > BHD 10.000 and ≤ BHD 30.000 | BHD 1.500 |
| > BHD 30.000 | Free |

`computeFreeShippingUpsell` is derived from `computeShippingFee` itself
(not an independent threshold check), so the upsell message and the actual
fee can never disagree at a boundary. At exactly BHD 30.000, shipping is
still the reduced BHD 1.500 fee (the rule is strictly "above"), so the
upsell's `remaining` is one fils, not zero — an intentional, unit-tested
edge case, not a bug. Boundary tests cover exactly BHD 10.000, just above
BHD 10.000, exactly BHD 30.000, and above BHD 30.000.

### Checkout flow

`services/checkout/create-order.ts#createOrder` is the one checkout/order-
creation use case, called from `features/checkout/actions.ts`'s
`submitCheckoutAction` Server Action (itself rate-limited by IP via
`services/rate-limiting/default-rate-limiter.ts` before anything else
runs). In order:

1. Validate customer info (`services/checkout/validation.ts#validateCustomer`
   — full name, Bahrain mobile via `core/customer/phone.ts`, email) and
   fulfillment (`validateFulfillment` — delivery address via
   `core/delivery/rules.ts#isValidDeliveryAddress`, or the fixed pickup
   location from `config/pickup.ts`; schedule re-checked against
   `core/scheduling/rules.ts#isScheduleAvailable` using the *server's* own
   clock, never trusting a client-submitted `available: true`).
2. Begin the idempotency record (`IdempotencyRepository.begin`, scope
   `"checkout"`) — see Idempotency below.
3. Revalidate the cart (`getPricedCart`) against live catalog data; reject
   an empty cart or one with blocking issues (`hasBlockingIssues`).
4. Build server-trusted `OrderLine[]` from the priced cart
   (`buildOrderLinesFromPricedCart`) and create the `Order` with a freshly
   generated order number, retrying up to 5 times on a number collision
   (`ConflictError` from `OrderRepository.create`).
5. Reserve inventory for every line (`services/inventory/reservations.ts#reserveOrderLines`);
   on failure, the just-created order is marked `cancelled` and the error
   propagates — a checkout never leaves a "confirmed" order with unreserved
   stock.
6. Create the `Payment` (`services/payments/create-payment.ts`) — for
   `tap`, this opens the real (or fake, in dev/test) hosted-checkout
   session and returns a redirect URL; for `cash`, it just records a
   `cash_pending` payment.
7. Clear the cart, send the order-confirmation email (best-effort, see
   Email below), and mark the idempotency record `completed`.

Any error after step 2 marks the idempotency record `failed` before
re-throwing — a client must submit a **new** idempotency key to retry after
a genuine failure (see Idempotency).

### Order data model

`core/orders/entities.ts#Order` — public `orderNumber` (customer-facing)
kept separate from the internal Firestore `id` (never shown to a
customer); `OrderCustomerSnapshot`, `OrderFulfillment`
(delivery-with-address-and-schedule, or pickup-with-location-and-schedule),
`OrderLine[]` (server-trusted product/variant/price/name snapshots that
survive a later catalog change), `subtotal`/`shippingFee`/`discountTotal`
(always zero — see Known limitations)/`grandTotal`, `currency`,
`paymentMethod`/`paymentStatus`, `status`, `source: "web"` (reserved for a
future POS/wholesale value), `idempotencyKey`, and a `version` bumped on
every update (the same optimistic-concurrency pattern Phase 3's
`update-product.ts` uses).

`ORDER_STATUSES` models the full future lifecycle (`pending_payment`,
`confirmed`, `preparing`, `ready`, `out_for_delivery`, `completed`,
`cancelled`), but Phase 5's own code only ever sets `pending_payment`
(new `tap` orders), `confirmed` (new `cash` orders, and `tap` orders once
paid), or `cancelled` — the rest exist so Phase 6's admin order-management
screen has a stable enum to build against. `isValidOrderStatusTransition`
only defines the two transitions this phase's own code performs.

**Order numbers** (`core/orders/rules.ts#buildOrderNumber`): `ORD-YYMMDD-XXXXXX`,
e.g. `ORD-260130-7K3PXQ` — the random suffix (drawn from a 32-character
alphabet excluding visually-ambiguous characters `0`/`O`/`1`/`I`/`L`) is
what actually makes each number unique and non-guessable; the date groups
orders for human scanning without exposing a running sequence/volume
count. Uniqueness under concurrency is enforced the same way Phase 3
enforces SKU/slug uniqueness — `FirestoreOrderRepository.create()` claims
an `"order-number"` unique key via the same `catalogUniqueKeys` mechanism,
inside the transaction that creates the order document, and throws
`ConflictError` on collision — `createOrder` catches that and retries with
a fresh number.

### Payment architecture and Tap configuration

`core/interfaces/payment-provider-port.ts#PaymentProviderPort` is the one
seam between this app and Tap Payments — `services/payments/*` depends
only on this interface, never on Tap's SDK/HTTP API directly. Card data
never passes through or is stored by this application: `createCharge`
returns a hosted-page `redirectUrl` the browser is sent to, and this app
only ever sees a charge id and a status back.

`infrastructure/payments/tap/tap-payment-provider.ts` talks to Tap's v2
Charges API directly over `fetch`. **This was implemented without access
to a real Tap sandbox account** — the exact field names/status strings
reflect Tap's publicly documented API, but must be reconfirmed against
<https://developers.tap.company> before processing a real live payment.
`infrastructure/payments/tap/fake-tap-provider.ts#FakeTapProvider` is a
same-port, in-memory drop-in, selected automatically by
`services/payments/dependencies.ts` whenever `TAP_SECRET_KEY` isn't set
(always true in this repo's CI/emulator/local-dev runs, since no real Tap
credentials are committed) — it never fakes business logic, only the
transport: a test calls `createCharge`/`buildWebhookBody` to simulate
exactly what a real Tap webhook delivery would say, and that body flows
through the *exact same* `handle-tap-webhook.ts` code a real webhook would.
Set `TAP_SECRET_KEY` in `.env.local` (see `.env.example`) to switch to the
real adapter in a real deployment — no code change required.

**Webhook security** (`app/api/payments/tap/webhook/route.ts`): the raw
request body is read via `.text()`, never `.json()`, because signature
verification must run over the exact bytes Tap sent. `verifyWebhookSignature`
HMAC-SHA256s a fixed, ordered concatenation of charge fields with the
secret key and compares in constant time (`timingSafeEqual`); a malformed
or missing signature fails closed (`false`), never throws. Tap doesn't
send a separate "event id," so `` `${chargeId}:${status}` `` is used as the
webhook idempotency key — this correctly treats a *redelivery* of the same
status as a duplicate while still letting a genuine progression (e.g.
`AUTHORIZED` → `CAPTURED`) through as a new event.

**Payment statuses**: `pending`/`authorized`/`paid`/`failed`/`cancelled`/
`refunded` (modeled, no refund-execution flow exists — see Known
limitations) apply to `tap`; `cash_pending`/`cash_confirmed` are cash's own
two-step lifecycle and never apply to `tap`. `Order.paymentStatus` is one
field whose meaning depends on `Order.paymentMethod`.

### Stock reservation lifecycle

`InventoryRecord.reserved` (modeled since Phase 3, unwritten until now) is
the "previously deferred order-reservation workflow" this phase implements.
One `InventoryReservation` document per `(orderId, productId, variantId)`;
`FirestoreInventoryReservationRepository.reserve()` both creates that row
and increments the matching `reserved` counter inside one transaction, so
the aggregate can never drift from the sum of live reservations.
`canDecreaseStock` (Phase 3's on-hand-decrease rule, reused verbatim
against `reserved` instead) enforces "does taking N more units still leave
availability ≥ 0, unless backorder is allowed" under concurrent checkouts
— proven under real concurrent load in
`tests/integration/firestore-inventory-reservation-repository.test.ts`.

A line whose product/variant has `trackInventory: false` is **skipped
entirely** by `services/inventory/reservations.ts#reserveOrderLines` —
there is no `onHand` count to reserve against for unlimited stock, the
same way cart pricing never caps such a line's quantity.

**Expiry**: reservations are reclaimed lazily, not by a background sweep —
`reserve()`'s own transaction queries for *this same* product/variant's
own expired-but-still-`"reserved"` rows and releases them first, before
checking whether new stock is available. `config/inventory.ts#RESERVATION_EXPIRY_MS`
sets ~30 minutes for `tap` (roughly how long a shopper is realistically
still completing a payment session) and ~7 days for `cash` (a backstop,
not the primary release mechanism — see below). A proactive Cloud
Scheduler sweep would reclaim capacity sooner for an unrelated product
waiting on it, but isn't required for correctness; noted in Backlog.

**Commit** (reservation → permanent deduction): for a `tap` order, only
once the webhook reports `paid` (`handle-tap-webhook.ts`); for a `cash`
order, only once an authorized admin confirms cash receipt
(`confirm-cash-payment.ts`) — inventory is never permanently deducted
before that, even though it *is* reserved (so it can't be oversold) the
moment the order is accepted. `commitOrderReservations`/`releaseOrderReservations`
are both idempotent (a no-op on an already-committed/released line) and
operate per-order via `listByOrder`.

### Cash order lifecycle and the admin confirmation action

A `cash` order is created `confirmed` immediately (there's no online
payment gate to wait on) with `paymentStatus: "cash_pending"`; inventory is
reserved at that moment so it can't be oversold, but **not** permanently
deducted. `POST /api/admin/orders/[orderId]/confirm-cash-payment`
(`requireSession` + `services/payments/confirm-cash-payment.ts`, gated on
the `payments:manage` permission) is the minimal protected action an
authorized staff member calls once cash is actually received in hand —
idempotent (a no-op if already `cash_confirmed`, a `ConflictError` if the
order isn't in a confirmable state), it commits the reservation, updates
the `Payment` and `Order`, records a `cash_payment_confirmed` audit entry,
and sends the payment-confirmation email. A full order-management UI
(listing, filtering, bulk actions) is Phase 6's concern — this route is
only the use case a future action button would call.

### Idempotency

`core/interfaces/idempotency-repository.ts#IdempotencyRepository` is one
general-purpose mechanism, reused everywhere Phase 5 needs one: checkout
submission (scope `"checkout"`), payment webhook processing (keyed by
Tap's own `chargeId:status`, via `PaymentWebhookEventRepository` instead —
a separate, purpose-built idempotency ledger since a webhook event isn't a
"submission" with a client-generated key), and reservation reserve/release/
commit (each individually idempotent per order+product+variant, see
above). `IdempotencyRepository.begin(scope, key)` is the one atomic
operation: it creates an `in_progress` record if none exists
(`created: true`, proceed), or returns the existing one unchanged
(`created: false`) — `completed` returns the prior result, `in_progress`
means a concurrent duplicate is still running, and `failed` means this
exact key already failed once and needs a **new** key to retry (by design
— see Checkout flow). Regression tests cover duplicate checkout submissions
and repeated webhook deliveries.

### Public order tracking

`services/orders/track-order.ts#trackOrder` requires an order number
**and** the mobile number or email used at checkout — `NotFoundError` with
the *exact same generic message* is thrown for a malformed order number, a
number that doesn't exist, and a number that exists but whose contact
factor doesn't match, so a caller can never distinguish "wrong
verification" from "no such order," which is what makes probing/
enumerating order numbers unproductive.
`core/orders/public-view.ts#buildPublicOrderView` returns only: order
number, status, fulfillment method, schedule, a redacted item summary
(product name + quantity, no per-unit pricing detail beyond the total),
grand total, and a public-safe payment-status label (`publicPaymentStatusLabel`
collapses `cash_pending`/`pending` into "Pay on delivery/pickup" /
"Awaiting payment" rather than exposing the raw enum) — never the internal
Firestore id, `idempotencyKey`, full customer snapshot, exact delivery
address, or `version`/audit data. `/orders/track` and `/checkout/success`
share one `OrderLookupForm` component; the success page pre-fills the order
number from its query string but still requires the shopper to type their
own contact info before anything is shown — the query string alone is
never treated as proof of ownership. `trackOrderAction` is rate-limited by
IP the same way checkout submission is.

### Email delivery and the retry seam

`services/email/send-transactional-email.ts` is the one path every order/
payment flow sends through: it **always** records the attempt in the
durable `emailOutbox` collection first, then makes a best-effort
`EmailPort.send()` attempt, then marks the outbox entry `sent`/`failed`.
`EmailPort.send()` itself never throws — a delivery failure is a normal,
expected outcome, never something that can propagate into failing the
order/payment it's attached to. `infrastructure/email/console-email-provider.ts#ConsoleEmailProvider`
is Phase 5's only adapter (logs instead of delivering through a real ESP);
`core/email/templates.ts` renders all five templates (order confirmation,
payment confirmation, payment failure, pickup confirmation, delivery
confirmation) as pure functions. No background worker retries `"failed"`
outbox entries yet — the durable record it would scan already exists, so
adding one is additive (see Known limitations). WhatsApp notifications are
explicitly Backlog, not built.

### Firestore collections and indexes

New collections, all server-only (Admin SDK) — never read/written by any
client SDK: `carts`, `orders`, `orderEvents` (append-only status-change
ledger, mirrors `inventoryAdjustments`), `payments`, `paymentEvents`
(webhook-delivery idempotency ledger), `inventoryReservations`,
`checkoutIdempotency`, `emailOutbox`. `firestore.indexes.json` adds one
composite index: `inventoryReservations` on `(productId, variantId,
status, expiresAt)` for the expired-reservation reclaim query inside
`reserve()`. No unrelated collections were added.

### Security

- **No client-direct trusted writes**: every cart/checkout/payment
  mutation goes through `services/*`; `firestore.rules` denies all client
  read/write on every Phase 5 collection (defense-in-depth — the Admin SDK
  bypasses rules by design, so the real enforcement is that no client SDK
  code path exists for any of them). Covered by
  `tests/integration/firestore-security-rules-phase5.test.ts` for both an
  unauthenticated and an arbitrary authenticated client.
- **Never trust the browser** for price, product name, or availability —
  enforced structurally by `CartLineCatalogSnapshot` always being rebuilt
  from live data (see Cart architecture) and by `createOrder` revalidating
  the cart immediately before building order lines.
- Checkout submission and order tracking are rate-limited by IP
  (`config/rate-limits.ts`); the Tap webhook is instead gated by signature
  verification, since it's a server-to-server call with no browser Origin
  to check.
- Server Actions (cart/checkout mutations) get Next.js's built-in
  Origin/Host check on every invocation, the same class of protection
  `lib/csrf.ts` gives the two pre-auth Route Handlers explicitly (see
  Phase 2's Security baseline) — no second CSRF scheme was added.
- `payments:manage` (and `payments:view`/`orders:view`/`orders:manage`)
  needed no new permission namespaces or actions — Phase 2 already
  reserved the `payments`/`orders` namespaces and the `manage`/`view`
  actions across every module; Phase 5 is simply the first phase to
  actually gate something behind them.
- Every trusted/system-initiated audit log entry (`cart_checkout_started`,
  `order_created`, `inventory_reserved`, `inventory_reservation_released`,
  `payment_started`, `payment_succeeded`, `payment_failed`,
  `payment_webhook_received`, `order_cancelled`) sets `actorUid: null` —
  the same convention `services/auth/create-session.ts` already uses for
  pre-auth/system events — while `cash_payment_confirmed` records the
  real staff `actorUid`, since that one *is* a human-initiated action.

### Emulator and fake-provider setup

Identical to Phase 2–4's Firebase Emulator Suite setup — `.env.test`
deliberately leaves `TAP_SECRET_KEY` unset so `FakeTapProvider` is always
selected in CI/emulator/local-dev runs, and sets a fixed
`CART_COOKIE_SECRET` (test-only, never a real secret). `pnpm run
test:integration` and `pnpm run test:e2e:auth` both wrap `firebase
emulators:exec` and now include Phase 5's Firestore integration tests
(inventory reservation concurrency, order-number collision, Tap webhook
reconciliation against real Firestore, Phase 5 security rules) and
`checkout.spec.ts` (guest cart → checkout → cash order → verified
tracking; card payment redirect to `FakeTapProvider`'s fake hosted page,
intercepted via Playwright's own request routing since `fake-tap.test`
isn't a real domain; order-tracking enumeration-resistance).

### Known limitations

- No refund-execution flow — `refunded` is a modeled `PaymentStatus`
  value only.
- No background worker retries a `"failed"` email-outbox entry — the
  durable record exists, nothing scans it yet.
- Reservation expiry is reclaimed lazily (on the next `reserve()` for the
  same product/variant), not by a proactive sweep — an expired reservation
  for a product nobody else is trying to buy sits released-but-unnoticed
  until someone does.
- `discountTotal` is always zero — the field/seam exists, no
  promotions/coupons engine sits behind it yet.
- Delivery/pickup slot rules are deliberately simple (fixed time windows,
  a same-day cutoff hour, no per-slot capacity tracking, no route
  planning) — `isSlotAtCapacity` is a seam that always returns `false`.
- A single pickup location, configured via env/code
  (`config/pickup.ts`), not an admin-editable `pickupLocations` collection.
- `TapPaymentProvider`'s exact field names/status strings were implemented
  against Tap's public API docs without a live sandbox account to verify
  end-to-end — reconfirm before processing a real payment.
- WhatsApp order/payment notifications are not built (email only).

### Future integration seams

- **Customer accounts**: `CartRepository`/the signed cart cookie already
  separate "cart identity" from "browser session," so merging a guest
  cart into an account cart on login is additive, not a redesign.
  `OrderCustomerSnapshot` is a durable per-order snapshot regardless —
  linking historical orders to a future `customers` collection would be
  an additive `customerId` field.
- **Admin order management** (Phase 6): `ORDER_STATUSES`/`isValidOrderStatusTransition`
  already model the full lifecycle beyond what checkout itself drives;
  `orderEvents` is already an append-only status-history ledger ready for
  a real admin timeline view. `confirm-cash-payment.ts`'s route is the one
  minimal action Phase 5 needed to validate the cash lifecycle — a real
  order list/detail/bulk-action UI is Phase 6's own scope.
- **Refund execution**: `PaymentStatus` already models `refunded`; the
  actual Tap refund API call and the inventory/accounting implications
  are unbuilt.
- **Multi-currency**: `CurrencyCode`/`CurrencyDefinition` are already a
  seam `Money` is built against; Phase 5 only ever constructs `BHD`.
- **Proactive reservation-expiry sweep**: a Cloud Scheduler job that
  reclaims expired reservations for products nobody is actively trying to
  reserve, instead of only reclaiming lazily on next use.
- **Email retry worker**: a scheduled job scanning `emailOutbox` for
  `"failed"` entries and re-attempting delivery with backoff.

## Phase 6 — Order Management, Customers, Inventory Operations, and Admin Dashboard

Builds the operational back office on top of Phase 5's order/payment/
reservation foundation: a full admin order-management screen (list,
detail, status workflow, actions), a derived customer directory rolled up
from order history, inventory alerts and a proactive (admin-triggered)
expired-reservation sweep, and an admin dashboard plus a reporting
foundation (daily/weekly/monthly sales, best sellers, orders by status).
No new customer-facing surface — every page in this phase lives under
`/admin`. `ORDER_STATUSES`/`orderEvents`/`confirm-cash-payment.ts` were
already modeled by Phase 5 specifically for this phase to build against
(see its README section's Future integration seams) — this phase wires
them into a real UI rather than redesigning any of it.

### Architecture

Same layering as every prior phase:

```
core/orders/                  schemas.ts (Zod: list/change-status query & input validation),
                               rules.ts extended — full status-transition graph,
                               allowedNextStatuses, buildOrderSearchTokens, order search tokenizer
core/customer/                entities.ts (Customer), rules.ts (key normalization, totals fold,
                               search tokens), schemas.ts
core/reports/                 entities.ts (SalesBucket/BestSellingProductRow/OrdersByStatusRow),
                               rules.ts (day/week/month bucketing, best-sellers, orders-by-status —
                               pure functions over already-fetched data), schemas.ts
core/interfaces/               order-repository.ts extended (list/listByCustomer), customer-repository.ts,
                               report-repository.ts, inventory-reservation-repository.ts extended
                              (listExpired), inventory-repository.ts extended (listOutOfStock)
infrastructure/firebase/       firestore-order-repository.ts extended (list/listByCustomer),
  repositories/                firestore-customer-repository.ts, firestore-report-repository.ts,
                              firestore-inventory-repository.ts / firestore-inventory-reservation-
                              repository.ts extended
services/orders/               list-orders.ts, get-order.ts, change-order-status.ts (the one
                              transition engine), order-actions.ts (named wrappers), confirm-order-
                              payment.ts, release-order-reservation.ts, dependencies.ts extended
services/customers/            list-customers.ts, get-customer.ts, upsert-customer-from-order.ts,
                              dependencies.ts
services/dashboard/            get-dashboard-stats.ts, dependencies.ts
services/reports/              sales-report.ts, best-selling-products.ts, orders-by-status.ts,
                              dependencies.ts
services/inventory/            expire-reservations.ts (the proactive sweep), reservations.ts's
                              commitOrderReservations fixed (see Inventory lifecycle below)
features/admin-orders/         actions.ts (Server Actions), parse-search-params.ts, components/
                              (orders-table, orders-filters, order-status-badge, order-info-panels,
                              order-status-timeline, order-reservation-status, order-actions-panel)
features/admin-customers/      parse-search-params.ts, components/ (customers-table, customers-filters)
features/admin-dashboard/      components/ (stat-tile, inventory-alerts, top-selling-products)
features/admin-reports/        parse-search-params.ts, components/ (sales-report-table,
                              best-sellers-table, orders-by-status-table, reports-filters)
features/admin-shell/          cursor-pagination.tsx (generic admin list pagination)
lib/                            cursor-pagination.ts (generic cursor/history query-string helpers)
app/admin/orders/, orders/[orderId]/, customers/, customers/[customerId]/, reports/
app/admin/page.tsx             rebuilt as the real dashboard (was a placeholder shell)
```

No UI or route imports Firebase Admin, Firestore, or a repository
directly — `features/*` and `app/*` only ever call `services/*`, the
same boundary `eslint-plugin-boundaries`/`tests/unit/architecture-
boundaries.test.ts` has enforced since Phase 1.

### Order Management architecture

**List** (`/admin/orders`, `services/orders/list-orders.ts`): filters —
status, payment status, delivery/pickup, date range — plus a search box
matching order number, customer name, phone, or email, and sort by date,
grand total, or order number. Search follows the exact two-step strategy
`services/storefront/search-products.ts` established: the *longest* word
of a multi-word query is the one Firestore `array-contains` filter
(`OrderRepository.list`'s `search` field); any remaining words are
checked in-memory against the bounded page that query already returned —
never a second Firestore call. `core/orders/rules.ts#buildOrderSearchTokens`
builds the stored index: word-prefix tokens for customer name (same
`core/catalog/rules.ts#buildSearchTokens` strategy), and **whole-string**
prefix tokens (punctuation preserved) for order number/email/mobile, so a
staff member can progressively type a partial order number, email, or
phone number and still get a match — unlike SKU search's exact-only
convention, an order number/email is looked up by partial prefix as often
as a complete value. A date-range filter forces the underlying query back
to sort-by-`createdAt`, since Firestore requires the range filter's field
to be the query's first `orderBy` — documented on `OrderRepository.list`'s
JSDoc and `FirestoreOrderRepository.list`'s implementation, not something
the admin UI silently gets wrong.

**Detail** (`/admin/orders/[orderId]`, `services/orders/get-order.ts`):
one call returns the order, its full `orderEvents` status-change ledger
(oldest first — doubles as "status timeline" and "audit history"), and
its `InventoryReservation` rows ("inventory reservation status"). The
page renders customer information, payment information, delivery *or*
pickup information (whichever the order used), the line-item table, and
an actions panel.

**Status workflow** (`core/orders/rules.ts`): the full graph beyond
Phase 5's own two transitions —

| From | To |
| --- | --- |
| `pending_payment` | `confirmed`, `cancelled` |
| `confirmed` | `preparing`, `cancelled` |
| `preparing` | `ready`, `cancelled` |
| `ready` | `out_for_delivery`, `completed`, `cancelled` |
| `out_for_delivery` | `completed`, `cancelled` |

`completed`/`cancelled` are terminal (`isTerminalOrderStatus`) — neither
has an outgoing edge. `allowedNextStatuses(from, fulfillmentMethod)`
additionally filters `out_for_delivery` out for a `pickup` order (there's
no courier leg to track), so the admin UI never offers a
fulfillment-method-inappropriate action even though the raw transition
map allows it from `ready`. `services/orders/change-order-status.ts` is
the one engine every transition funnels through: `orders:manage`
permission, optimistic-concurrency `expectedVersion` check (defense in
depth alongside `OrderRepository.update()`'s own re-check), the
transition-validity check above, a same-target-status no-op (idempotent
retry of the same button click, not an error), a payment guard
(`completed` requires `paymentStatus` to already be `paid`/`cash_confirmed`
— an order can never be marked complete while still unpaid), and the
side effects below. **Every transition records an `OrderStatusEvent`**
(`orderEvents`, append-only, same shape/guarantee as `auditLogs`/
`inventoryAdjustments`) and an `order_status_changed` audit-log entry with
the real staff actor — this closes a Phase 5 gap where `create-order.ts`
and `handle-tap-webhook.ts`'s own status changes only wrote `auditLogs`,
never `orderEvents`; both now also record the event, so an order's
status timeline is complete from the very first status it ever had
(`fromStatus: null`), not just the transitions Phase 6's own actions
drive.

### Order Actions (`services/orders/order-actions.ts`, `confirm-order-payment.ts`, `release-order-reservation.ts`)

Named, permission-gated, single-purpose wrappers over the engine above —
what the action buttons actually call:

- **Confirm payment** (`confirm-order-payment.ts`) — the manual admin
  override for a `tap` order stuck in `pending_payment` whose webhook
  never arrived; `payments:manage`. Mirrors `handle-tap-webhook.ts`'s own
  `paid` branch (commit reservations, update `Payment`/`Order`, send the
  confirmation email) rather than routing through the generic engine,
  the same way Phase 5's own `confirm-cash-payment.ts` does more than a
  plain status transition.
- **Confirm cash payment** — unchanged Phase 5 `confirm-cash-payment.ts`,
  now reachable from the order-detail action panel instead of only its
  own route.
- **Cancel order** — any non-terminal status → `cancelled`; releases
  still-`reserved` inventory and reverses this order's contribution to
  its customer's `totalSpent` (see Customer architecture).
- **Mark preparing / Mark ready** — `confirmed → preparing → ready`.
  `ready` (pickup order) sends the `pickup_confirmation` email template —
  modeled by Phase 5, never wired to anything until now.
- **Mark out for delivery** — `ready → out_for_delivery`, delivery orders
  only; sends `delivery_confirmation` (same "modeled but unwired" story).
- **Mark delivered / Complete order** — one function
  (`order-actions.ts#completeOrder`) covers both: "Mark delivered"
  (`out_for_delivery → completed`, a courier-confirmed delivery) and
  "Complete order" (`ready → completed`, a picked-up pickup order) are
  the same target transition; which start state is valid depends only on
  fulfillment method, already enforced by the transition graph. The admin
  UI just labels the button differently based on `order.fulfillment.method`.
- **Release reservation** (`release-order-reservation.ts`) — a standalone
  action distinct from cancelling the whole order; idempotent.

### Customer architecture

No customer-accounts phase exists yet (Phase 5's own Known limitations),
so `core/customer/entities.ts#Customer` is a **derived aggregate**, not a
first-class write target — keyed by normalized email
(`customerKeyFromEmail`, the exact same normalization
`services/checkout/validation.ts#validateCustomer` already applies), not
a generated id, since checkout always requires and normalizes an email.
`kind: "guest" | "registered"` and an optional `userId` are modeled now
and unwritten (`kind` is always `"guest"` today) — linking a `Customer` to
a future registered account is an additive field, matching exactly what
Phase 5's README flagged as the seam this phase would need.

**Write path**: `services/customers/upsert-customer-from-order.ts`,
called once from `services/checkout/create-order.ts` right after
inventory reservation succeeds (never for an order whose reservation
failed and got rolled back to `cancelled` — that order never really
"happened"). `CustomerRepository.upsert(customerId, fold)` is a
transactional read-modify-write (the repository owns the transaction,
the caller only supplies a pure fold function —
`core/customer/rules.ts#nextCustomerOnOrderCreated`) so two concurrent
first orders from a brand-new customer can never both observe
`existing: null` and clobber each other. `totalOrders`/`totalSpent`
increment on every order created; `fullName`/`mobile`/`companyName`
always reflect the *latest* order's snapshot (the same "latest wins"
convention `Order.customer` itself uses). **Reversal**: whenever an order
that already contributed to a customer's totals is cancelled — via the
admin `cancelOrder` action, or via `handle-tap-webhook.ts`'s own
failed/cancelled branch — `core/customer/rules.ts#reverseCancelledOrderSpend`
subtracts that order's `grandTotal` from `totalSpent` (floored at zero;
`totalOrders` is deliberately left unchanged, since the order still
genuinely happened).

**List/detail** (`/admin/customers`, `services/customers/list-customers.ts`
/`get-customer.ts`): same primary-token-plus-in-memory-refinement search
strategy as orders, over name/phone/email. Detail shows contact info,
account type (guest today), and full order history
(`OrderRepository.listByCustomer`, reusing `OrdersTable`).

### Dashboard architecture

`services/dashboard/get-dashboard-stats.ts`, gated on `dashboard:view` —
its own permission namespace, reserved since Phase 2 and unused until
now (deliberately separate from `reports:view`: a role can see the
dashboard's at-a-glance tiles without the deeper report drill-downs, or
vice versa). One call returns: order counts by status + total revenue
(`ReportRepository.getDashboardCounts`), low-stock and out-of-stock
inventory alerts (`InventoryRepository.listLowStock`/`listOutOfStock`),
the 10 most recent orders, and the top 5 best-selling products over the
trailing 30 days.

### Reporting architecture

`services/reports/{sales-report,best-selling-products,orders-by-status}.ts`,
gated on `reports:view`. All three share `core/reports/rules.ts`'s pure
functions operating on a bounded, already-fetched set of orders — the
Firestore query itself (`ReportRepository.listOrdersForReport`/
`listOrderLinesForReport`) is a single date-range-filtered fetch, capped
at `REPORT_SCAN_LIMIT` (5,000 orders). `bucketOrders` buckets by day, ISO
week, or month, filling every empty period with a zero-count row (a
report table never silently skips a quiet day); `computeBestSellingProducts`
aggregates line-item quantity/revenue keyed by `productId:variantId`;
`computeOrdersByStatus` always includes all seven statuses, zero-count or
not. `countsTowardRevenue(status)` — `pending_payment`/`cancelled`
excluded, everything else counted — is the one predicate every revenue
figure in the app (dashboard tiles, sales reports, best sellers) shares,
so "revenue" can never mean something different on two different screens.
`FirestoreReportRepository.getDashboardCounts` uses Firestore's native
`count()` aggregation per status (no document fetch at all) but sums
`totalRevenue` over an in-memory-summed bounded scan rather than a
`sum()` aggregation query — the same pragmatic "bounded scan, sum in
memory" tradeoff `listLowStock`/`listOutOfStock` already accept, chosen
here to avoid depending on `sum()` aggregation-query emulator support
that wasn't verified. No advanced analytics (cohorts, funnels, forecasting)
— explicitly out of scope per the spec.

### Inventory lifecycle

Reservation lifecycle (reserve/release/commit) is unchanged Phase 5 —
this phase adds:

- **Expired reservation handling**: `services/inventory/expire-reservations.ts`,
  an admin/scheduled-trigger action (`orders:manage`) that calls the new
  `InventoryReservationRepository.listExpired()` (a direct
  `status == "reserved" && expiresAt < now` query, `(status, expiresAt)`
  composite index) and releases every match, recording one
  `inventory_reservation_expired` audit entry. This is **on top of**,
  not instead of, Phase 5's existing lazy per-product reclaim inside
  `reserve()` — that guarantees correctness with zero sweep at all; this
  only reclaims capacity *sooner* for a product nobody else is currently
  trying to buy. No Cloud Scheduler trigger wires this up automatically
  yet (Backlog) — it's callable today from an admin action or a future
  scheduled HTTPS function with no further change.
- **Manual inventory correction**: unchanged — Phase 3's
  `adjustInventory`/`inventory:adjust` already covers this; Phase 6 adds
  no new correction path, just surfaces reservation state next to it on
  the order-detail screen.
- **A real bug fix**: `commitOrderReservations` (Phase 5,
  `services/inventory/reservations.ts`) used to `throw NotFoundError`
  whenever an order had zero reservations — which is *always* true for
  an order made entirely of untracked-inventory lines
  (`trackInventory: false`, a fully-supported, ordinary catalog
  configuration). That made `confirmCashPayment`/`confirmOrderPayment`
  fail for any such order. Found by this phase's own e2e test walking a
  real cash order through confirmation, and fixed: `commitOrderReservations`
  is now a no-op (not an error) when there's nothing to commit, matching
  `releaseOrderReservations`'s own equivalent no-op behavior. Every
  caller already resolves the `Order` itself (and throws its own
  `NotFoundError` if it doesn't exist) before ever reaching this
  function, so nothing relied on the old guard as an order-existence
  check.
- **Never double-deduction**: unchanged Phase 5 invariant —
  `reserve()`/`commit()`/`release()` are each idempotent per
  order+product+variant, and `commitOrderReservations` only ever acts on
  rows still in `"reserved"` status, so a repeated confirm action (or a
  reservation this phase's sweep already released) can never double-commit.

### Permission model

Reuses Phase 2's RBAC exactly as designed — every namespace/action this
phase gates on (`orders:view`/`manage`, `customers:view`/`manage`,
`dashboard:view`, `reports:view`, `payments:manage`) was already reserved
in `core/auth/permissions.ts#PERMISSION_NAMESPACES` since Phase 2, simply
unused until now. No RBAC code changes. `hasPermission`'s `manage`
wildcard and `super_admin` bypass apply identically. Server Actions and
Route Handlers under `/admin/orders`, `/admin/customers`, `/admin/reports`
all call `requireSession()`/`requirePermission()` themselves — the same
"the layout's redirect is UX-only, not the enforcement boundary"
discipline every prior phase established.

### Security

- Every new/extended repository stays server-only (Admin SDK) — no
  client Firestore SDK path exists for `customers` (new collection) or
  any of `orders`/`inventory*`'s new query shapes. `firestore.rules` adds
  an explicit deny block for `customers`, covered by
  `tests/integration/firestore-security-rules-phase6.test.ts`
  (unauthenticated **and** an arbitrary authenticated client, same
  Phase 5 convention).
- Every admin list/filter query param is Zod-validated
  (`core/orders/schemas.ts`, `core/customer/schemas.ts`,
  `core/reports/schemas.ts`) before it ever reaches a repository — a
  malformed or hand-edited query string degrades to defaults, never a
  500, the same convention `core/storefront/schemas.ts` established.
- Optimistic concurrency (`expectedVersion`) on every status-changing
  action — a stale admin tab can't silently clobber a status change made
  by someone else in the meantime.
- Every transition records its real staff actor (`order_status_changed`,
  `order_payment_confirmed`, `customer_created`/`customer_updated` —
  reserved for a future direct-edit path, unused today —
  `inventory_reservation_expired`, `inventory_manual_correction` —
  reserved, unused) via `actorUid`/`actorEmail`, never `null`, except the
  sweep's own release calls (`system:reservation_sweep`, following the
  established system-actor-prefix convention).

### Firestore collections and indexes

One new collection: `customers`, server-only, keyed by normalized email.
No other new collections — dashboard/reports read from `orders`/
`inventory` directly. New composite indexes on `orders` (status/payment
status/fulfillment method/search-tokens/customerId/grandTotal/order
number, each paired with `createdAt` as the tie-breaker or sole sort),
`customers` (search-tokens + `lastOrderAt`), and `inventoryReservations`
(`status`, `expiresAt` — the expired-sweep query). Emulator runs
auto-create whatever a query needs; a real Firebase project needs
`firebase deploy --only firestore:indexes` before these queries work in
production (not run by this phase — see Scope Control).

### Emulator and e2e setup

`tests/e2e/global-setup.ts` seeds a new `ORDERS_MANAGER_EMAIL` fixture
staff account with a **non-`super_admin`** role
(`orders:manage`, `customers:manage`, `dashboard:view`, `reports:view`,
`payments:manage`) — deliberately not reusing `SUPER_ADMIN_EMAIL`, whose
`sessionCreateByEmail` rate-limit budget (5 per 15 minutes) is already
fully spent by `auth.spec.ts`/`catalog.spec.ts`'s own logins within one
`pnpm run test:e2e:auth` run. `tests/e2e/admin-orders.spec.ts` performs
**exactly one login for its entire run** for the same reason
(`sessionCreateByIp`'s 10-per-15-minutes budget had only one spare slot
left) — every assertion (place an order, search/open/act on it through
the full status workflow to completion, customer roll-up, dashboard,
reports) runs in that one continuous authenticated session. It seeds its
own single untracked-inventory product directly (not
`storefront-fixtures.ts#seedStorefrontFixtures`, whose `withVariants`
product would otherwise leak extra rows onto `/admin/inventory` and
break `catalog.spec.ts`'s own "exactly one product" assumption on that
page — every spec in this run shares one un-reset Firestore emulator).
`playwright.auth.config.ts` now pins `workers: 1` for the same
shared-backend reason: different spec files running concurrently could
otherwise pollute each other's list-page assertions regardless of
per-file seriality.

### Known limitations

- `getDashboardCounts`'s `totalRevenue` and every report's
  `listOrdersForReport`/`listOrderLinesForReport` are bounded scans
  (5,000 orders for reports; a separate 5,000-order revenue scan for the
  dashboard) — accurate up to that volume, silently incomplete beyond it.
  Revisit with a `sum()` aggregation query (once verified against a real
  Firestore project, not just the emulator) or a maintained rolling total
  if order volume ever approaches this.
- The expired-reservation sweep (`expire-reservations.ts`) has no
  automatic trigger — it's an admin-callable action today, not a Cloud
  Scheduler job.
- Order search matches order number, customer name, email, and mobile
  only — no search by delivery address, SKU, or product name within an
  order.
- Cancelling an order whose inventory was already **committed** (a fully
  completed/paid order) does not automatically reverse the `onHand`
  deduction — that's a real stock discrepancy needing a manual
  `inventory:adjust` correction, the same edge case Phase 5's own
  reservation lifecycle never fully closed.
- No bulk order actions (bulk status change, bulk export) — one order at
  a time.
- `Customer.kind` is always `"guest"` — no registered-account linkage
  exists yet to ever set it to `"registered"`.
- No CSV/PDF export anywhere in the admin panel (orders, customers, or
  reports).

### Future integration seams

- **Registered customer accounts**: `Customer.kind`/`userId` are already
  modeled; linking a future authenticated account to its historical
  guest `Customer` record (matched by email) is additive.
- **Automatic reservation-expiry sweep**: `expire-reservations.ts`
  already does the real work — wiring it to a Cloud Scheduler-triggered
  HTTPS function is the only remaining piece.
- **Revenue/report aggregation at scale**: `ReportRepository`'s interface
  already isolates this concern; swapping the bounded-scan implementation
  for a maintained rolling-total or a real `sum()` aggregation query
  doesn't change any caller.
- **Bulk order actions**: `change-order-status.ts`'s engine already
  validates one transition at a time in a way a bulk wrapper could loop
  over directly.

## Phase 7 — Customer Accounts, CMS, Wishlist, Reviews, Promotions, and Full Site Management

Adds a customer-facing identity layer (separate from staff/admin auth by
construction) and everything that hangs off it — account area, saved
addresses, wishlist, back-in-stock alerts, product reviews and Q&A — plus
the marketing/merchandising side: coupons, automatic promotions, CMS
pages, site settings, an admin-configurable homepage, and admin-controlled
header/footer navigation. Every Phase 1-6 architectural pattern (clean
layering, RBAC, optimistic concurrency, idempotent writes, rate limiting,
enumeration-resistant errors, append-only audit logs, cursor pagination,
server-authoritative pricing) is reused, not redesigned.

### Architecture

```
core/customer-auth/            entities.ts (CustomerAccount, CustomerSession, NotificationPreferences),
                                rules.ts (email-verification token gen/hash/expiry), schemas.ts
core/customer-address/         entities.ts (CustomerAddress, reuses DeliveryAddress), schemas.ts
core/wishlist/                 entities.ts (WishlistItem, deterministic id + membership key)
core/back-in-stock/            entities.ts (BackInStockSubscription — pending/notified/cancelled)
core/notification-outbox/      entities.ts (NotificationOutboxEntry — separate durable retry-seam
                                from Phase 5's emailOutbox, see below)
core/reviews/                  entities.ts (Review, deterministic id per customer+product),
                                rules.ts, schemas.ts, aggregate.ts (ReviewAggregate sum/count)
core/questions/                entities.ts (ProductQuestion — status doubles as moderation +
                                answered state), schemas.ts
core/cms/                      entities.ts (CmsPage, optimistic-concurrency version), schemas.ts
core/site-settings/             entities.ts (SiteSettings singleton — store identity, footer,
                                nav, homepage sections, maintenance mode), schemas.ts
core/coupons/                  entities.ts (Coupon, keyed by its own code), rules.ts, schemas.ts
core/promotions/               entities.ts (Promotion — percentage/fixed/free_shipping,
                                scope+priority+stackable), schemas.ts
core/pricing/                  discount-engine.ts (pure scope-matching + amount calc, shared by
                                coupons and promotions), apply-discounts.ts (stacking rules),
                                priced-cart.ts (layers discounts onto Phase 5's PricedCart)
core/interfaces/                customer-account-repository.ts, customer-email-verification-
                                repository.ts, customer-address-repository.ts, wishlist-
                                repository.ts, back-in-stock-repository.ts, notification-
                                outbox-repository.ts, review-repository.ts, review-aggregate-
                                repository.ts, product-question-repository.ts, cms-page-
                                repository.ts, site-settings-repository.ts, coupon-repository.ts,
                                promotion-repository.ts
infrastructure/firebase/        firestore-customer-account-repository.ts, firestore-customer-
  repositories/                email-verification-repository.ts, firestore-customer-address-
                                repository.ts, firestore-wishlist-repository.ts, firestore-back-
                                in-stock-repository.ts, firestore-notification-outbox-
                                repository.ts, firestore-review-repository.ts, firestore-review-
                                aggregate-repository.ts, firestore-product-question-
                                repository.ts, firestore-cms-page-repository.ts, firestore-site-
                                settings-repository.ts, firestore-coupon-repository.ts,
                                firestore-promotion-repository.ts
services/customer-auth/         register/login/logout, request-password-reset, send/resend/
                                verify-email, link-guest-orders, update-profile, get-account,
                                session.ts (getCustomerSession/requireCustomerSession)
services/customer-addresses/    addresses.ts (CRUD + setDefault, ownership via NotFoundError)
services/customer-orders/       list-my-orders.ts, reorder.ts
services/wishlist/              wishlist.ts (list/add/remove/moveToCart)
services/back-in-stock/         subscribe.ts, unsubscribe.ts (token-based + session-based),
                                notify-restock.ts (the outbox/retry fan-out), list-my-
                                subscriptions.ts, admin-list.ts
services/reviews/               create/update/moderate-review.ts, list-product-reviews.ts,
                                admin-list-reviews.ts, verified-purchase.ts
services/questions/             ask-question.ts, answer-question.ts (answering == approving —
                                see core/questions/entities.ts), list-questions.ts
services/cms/                   manage-pages.ts (CRUD + optimistic concurrency + slug
                                uniqueness), get-public-page.ts (published-only + nav/footer list)
services/site-settings/         manage-settings.ts (admin), get-public-settings.ts (cached,
                                tag-invalidated)
services/coupons/               manage-coupons.ts (admin CRUD)
services/promotions/            manage-promotions.ts (admin CRUD)
services/pricing/               validate-coupon.ts, evaluate-cart-discounts.ts, get-discounted-
                                cart.ts, apply-coupon-to-cart.ts (rate-limited by cart id)
features/customer-auth/         login/register/forgot-password/logout/profile/notification-
  , customer-addresses/,        preferences forms, addresses list/form, orders table/reorder
  customer-orders/               button, all client components + Server Actions
features/wishlist/              local-wishlist.ts (guest localStorage seam), wishlist-context.tsx
                                (client Context — signed-in vs. guest membership), wishlist-
                                button.tsx, wishlist-grid.tsx
features/back-in-stock/         subscribe-form.tsx, subscriptions-list.tsx, actions.ts
features/reviews/                review-form.tsx, reviews-section.tsx, star-rating-*.tsx, actions.ts
features/questions/              questions-section.tsx, actions.ts
features/admin-cms/, admin-site-settings/, admin-coupons/, admin-promotions/, admin-reviews/,
  admin-questions/, admin-notifications/  admin CRUD/moderation UI for every area above
app/(storefront)/account/       login, register, forgot-password, verify-email (public) +
                                (protected)/ layout + overview/orders/profile/addresses/
                                wishlist/notifications
app/(storefront)/pages/[slug]/  public CMS page renderer
app/(storefront)/unsubscribe/back-in-stock/  token-based unsubscribe landing page
app/admin/*/cms/, site-settings/, coupons/, promotions/, reviews/, questions/,
  notifications/back-in-stock/  admin routes (reusing the existing admin shell)
app/api/customer-auth/          session, register, forgot-password Route Handlers (IP-rate-
                                limited, CSRF-checked — same pattern as staff auth)
app/api/back-in-stock/subscribe/  Route Handler (needs IP for rate limiting; a Server Action
                                has no request object to key that off)
app/api/wishlist/keys/          lightweight membership-key fetch for the client wishlist context
```

No admin/staff route, permission check, or Firestore collection from Phase
1-6 was touched beyond additive fields (see Data model changes below).

### Customer identity — isolated from staff/admin by construction

A customer account (`customerAccounts/{uid}`) is a completely separate
Firestore document, Firebase Auth flow, and session cookie
(`__Host-customer-session`, `services/customer-auth/session.ts`) from a
staff account (`users/{uid}`, `__Host-session`). A customer can never
satisfy `requireSession()` (staff) and a staff member's cookie is never
even read by `requireCustomerSession()` — this is a structural guarantee,
not a permission check that could be misconfigured. Password auth uses a
new `AuthSessionPort.createUserWithPassword()` method, distinct from
staff's passwordless `createUser` (staff sign in via a magic-link-style
flow from Phase 2; customers set a password at registration).

**Guest order linking** needed no data migration or per-order claim
mechanism: Phase 6's `customerKeyFromEmail`-based keying already means
every guest order is stored under a `Customer` aggregate keyed by the
shopper's email. `link-guest-orders.ts` runs once email verification
succeeds (never before — an unverified registration can't expose someone
else's order history just by matching an email string) and only updates
that `Customer` aggregate's `kind`/`userId` fields; `listMyOrders` was
already querying by the same key, so past orders become visible with no
further wiring.

**Email verification tokens** live in their own `customerEmailVerifications`
collection, storing only a SHA-256 hash — never a field on
`CustomerAccount` itself, and never a plaintext token anywhere at rest.
Password reset reuses Firebase's own hosted reset-email flow
(`AuthSessionPort.sendPasswordResetEmail`) rather than a second custom
system, scheduled via Next's `after()` the same way
`services/auth/request-password-reset.ts` already does, so the response
time never leaks whether an account exists.

### Wishlist — guest seam is client-only, not a server identity

A cart has a signed guest cookie identity (Phase 5); a wishlist doesn't.
Rather than invent one, a guest's wishlist lives entirely in
`localStorage` (`features/wishlist/local-wishlist.ts`) as a set of
`productId:variantId` keys. `WishlistProvider`
(`features/wishlist/wishlist-context.tsx`) is the one place guest vs.
signed-in is resolved: signed in, it fetches `/api/wishlist/keys` and
mutates through Server Actions against `wishlistItems/{customerUid}:
{productId}:{variantId}`; signed out, it reads/writes `localStorage`
directly. On mount with a session and leftover guest keys, it replays each
one as a real `addToWishlist` call and clears `localStorage` — "merge on
login" without a server-side guest-wishlist concept ever existing.

### Back-in-stock — a second, dedicated outbox

`notificationOutbox` is deliberately separate from Phase 5's `emailOutbox`
(`core/notification-outbox/entities.ts`'s doc comment): `emailOutbox`
records "did we try to send this email"; `notificationOutbox` records "did
this subscription get notified for this restock", which is what
`/admin/notifications/back-in-stock` needs to show. `adjustInventory`
(`services/catalog/adjust-inventory.ts`) detects a `0-or-below → positive`
available-quantity transition and schedules `notifyBackInStock` via
`after()` — fire-and-forget, so an email failure can never block or slow
down the inventory write that triggered it. Each subscription gets one
notification per restock (subscriptions are filtered to `status ==
"pending"`, flipped to `"notified"` only after a successful send); a
customer who's since turned off `notificationPreferences.backInStock` is
skipped without even enqueueing an outbox job. Unsubscribe works two ways:
a signed-in customer cancels from `/account/notifications`; a guest (or
anyone) uses the token-based link every email includes
(`/unsubscribe/back-in-stock?id=&token=`) — the token is a plain,
non-hashed field on the subscription itself (not the customer-auth-style
hashed/single-use kind), a deliberate choice since the worst case of
disclosure is someone cancelling one low-value alert, not an account
takeover.

### Reviews and Q&A

**Reviews** are keyed `${customerUid}:${productId}` — one review per
customer per product, structurally (a second submission is a
`ConflictError`, never a silent overwrite or a duplicate row).
`verifiedPurchase` is computed at submission time from a `"completed"`
order containing the product under the reviewer's own email — never
client-supplied. Moderation (`pending → approved/rejected/hidden`) is the
only place a review's contribution to `reviewAggregates/{productId}`
changes: crossing the approved boundary applies `±rating` to `sum` and
`±1` to `count` inside a Firestore transaction; every other transition
(e.g. `rejected → hidden`) leaves the aggregate untouched. A customer can
edit or delete their own review only while it's still `"pending"`.

**Product questions** fold moderation and "answered" into one state
(`core/questions/entities.ts`'s doc comment): the granted permission set
is `questions:view`/`questions:answer` only (no separate `questions:
moderate`), so a staff member approving a question *is* answering it —
`"approved"` always has a non-null `answer`, `"pending"`/`"rejected"`
never do. Public reads only ever see `"approved"` rows.

### Coupons, promotions, and the discount pipeline

`core/pricing/discount-engine.ts` is the one place a `"percentage"`/
`"fixed"`/`"free_shipping"` discount's monetary amount is computed from a
category/brand-matched, exclusion-filtered subset of cart lines — shared
by coupon and promotion evaluation so the two can never disagree for the
same scope/type/value. `core/pricing/apply-discounts.ts` combines them:

1. Every *eligible* automatic promotion (active, in date range, scope
   matches at least one line) is found.
2. If any eligible promotion is `stackable: false`, only the single
   **lowest-`priority`** one applies — admins rank precedence explicitly
   via a `priority` field rather than the engine guessing "biggest
   discount wins"; every other eligible promotion is dropped for this cart.
3. Otherwise, every eligible `stackable: true` promotion applies and their
   amounts sum.
4. A coupon (already fully validated server-side —
   `services/pricing/validate-coupon.ts`) then either **adds on top**
   (`stackable: true`) or **replaces every promotion entirely**
   (`stackable: false`) — a non-stackable coupon is the shopper's explicit
   choice to use *that* code instead of whatever automatic promotion would
   otherwise apply.

**Shipping-threshold decision (explicitly documented, per spec
requirement):** the shipping fee is always computed from the cart's
**pre-discount** subtotal (`core/cart/rules.ts#priceCart`, untouched by
Phase 7). A coupon/promotion can never change which shipping tier a cart
lands in — it can only override the fee to zero outright via a
`"free_shipping"`-type discount. Boundary cases (a cart just above the
free-shipping threshold keeps free shipping even after a coupon drops its
*discounted* total back below the threshold; a plain subtotal discount,
without an explicit free-shipping discount, never zeroes the fee) are
covered by `tests/unit/pricing/priced-cart.test.ts`.

**Server-authoritative, idempotent redemption:** `Cart.couponCode` is only
ever a *hint* — `evaluateCartDiscounts` re-validates it fresh on every
read (existence, active, date range, min subtotal, usage limit,
per-customer limit, first-order-only), and checkout
(`services/checkout/create-order.ts`) re-runs the exact same validation
with the now-known checkout email before ever computing the charged total.
`FirestoreCouponRepository.redeem()` increments `usageCount` and writes a
`couponRedemptions/{code}:{orderId}` row inside one transaction, keyed
deterministically so retrying the same order id can never double-count,
and refuses (returns `false`, no throw) once `usageLimit` is reached — the
caller treats that as "no longer available," not a hard error, since a
concurrent order could have claimed the last slot between validation and
redemption. **Documented cancelled/failed-order release policy:** a
cancelled order's coupon usage is **not** automatically released back to
the coupon's `usageCount` — the same class of intentionally-deferred
reconciliation edge case Phase 5/6 left documented rather than built (see
Known limitations).

`Order.couponCode`/`Order.appliedDiscounts` are immutable snapshots taken
at checkout — the same "the order keeps its own permanent copy" principle
`OrderLine` already uses for catalog data, so a later coupon edit or
deactivation can never change what an already-placed order shows was
charged. Both fields are optional on the `Order` type (matching
`customerId`'s existing precedent) since every pre-Phase-7 order predates
them and is never migrated.

### CMS, site settings, homepage, and navigation

**CMS pages** (`cmsPages`) use the same optimistic-concurrency pattern as
`Product` (`version`/`expectedVersion`, `ConflictError` on mismatch) plus
slug-uniqueness enforcement (query-checked, not transactionally claimed
like SKUs — an accepted simplification given this is a low-volume,
admin-only write path, not a public-facing race). The public route
(`/pages/[slug]`) only ever resolves `status == "published"` pages.

**Site settings** (`siteSettings`, a single `"singleton"` document)
deliberately **consolidates** what the spec's site-settings and
nav/footer-admin-control sections both describe — store identity,
contact, social links, footer columns, payment logos, shipping-policy
text, maintenance mode, header nav links, category/brand-menu toggles,
and homepage-section visibility/order/title overrides — into one document
and one `/admin/site-settings` screen, rather than a separate
`navigationConfig`/`homepageSections` collection each. In practice an
admin edits all of this together; documenting the decision here (per the
spec's own "document embedded-vs-separate document decisions
intentionally" instruction) is the seam a future split would start from.
Reads go through `services/site-settings/get-public-settings.ts`, cached
and tag-invalidated the same way every other storefront read is
(`services/storefront/cache.ts`); an admin save calls
`revalidateStorefrontTag` immediately, so the next request never sees
stale settings. `ui/layout/header.tsx`/`footer.tsx` are now pure
presentational components (props only, no `services/*` import — the
`eslint-plugin-boundaries` rule that `ui/` can't depend on `services/`
applies here same as everywhere else); `app/(storefront)/layout.tsx` does
the fetching and composes the props.

**Homepage sections** are config-driven
(`SiteSettings.homepageSections`): `features/storefront/home/home-page.tsx`
renders whichever sections are `visible`, in `sortOrder`, with an optional
admin-supplied title/subtitle override, falling back to a built-in default
per section. A category grid is **not** one of the section keys — per the
spec, category browsing lives only in the header/hamburger nav now; the
Phase 4 homepage's `FeaturedCategories` section and component were removed.

**Maintenance mode** is informational only — an admin-configured banner
shown on every storefront page, not an access gate (see Known
limitations).

### Search enhancements

`core/catalog/rules.ts#buildSearchTokens` gained two new optional inputs,
`coffeeOriginCountry`/`coffeeRegion` (from `CoffeeAttributes.originCountry`/
`.region`), indexed the same word-prefix way name/brand/category/tags
already are — wired into both `create-product.ts` and `update-product.ts`.
Product type, tags, and SKU were already indexed before Phase 7; barcode
was already an exact-match search token (not display) from Phase 3/4 and
is untouched — it was already never exposed in any public DTO.

### Permissions

Six new/activated namespace-action combinations, RBAC-checked in every
service exactly the way Phase 2 established (`requirePermission`, `super_admin`
bypass, `manage` wildcard): `cms:view/create/edit/delete`,
`settings:view/manage`, `promotions:view/manage` (covers both coupons and
promotions — the spec's permission list has no separate `coupons:*`),
`reviews:view/moderate`, `questions:view/answer`, `notifications:view/manage`
(back-in-stock admin views). Every customer-facing mutation is instead
gated by `requireCustomerSession()`/ownership checks (a wishlist item, an
address, a review, a subscription — `NotFoundError`, never `ForbiddenError`,
when the resource belongs to someone else, so a caller can never learn
that a given id exists). `/admin/roles`'s permission-picker UI is fully
generated from `PERMISSION_NAMESPACES`/`PERMISSION_ACTIONS`, so every new
permission here was immediately grantable with no UI change.

### Data model changes to existing entities

- `Cart` gained `couponCode: string | null` (the applied-coupon hint).
- `CartLineCatalogSnapshot` gained `categoryIds`/`brandId` — purely so the
  discount engine can scope-match a line; `priceCart` itself never reads
  either field.
- `Order` gained optional `couponCode`/`appliedDiscounts` (see above).
- `Money` (`core/money/money.ts`) gained `min()` and `percentageOf()` —
  generic, reusable arithmetic helpers the discount engine needed, not
  coupon-specific.
- `AUDIT_LOG_EVENT_TYPES`/`PERMISSION_NAMESPACES`/`PERMISSION_ACTIONS`/
  `EMAIL_TEMPLATES` all gained Phase 7 entries additively (see `core/auth/
  entities.ts`, `core/auth/permissions.ts`, `core/interfaces/email-port.ts`).

### New Firestore collections

`customerAccounts`, `customerEmailVerifications`, `customerAddresses`,
`wishlistItems`, `backInStockSubscriptions`, `notificationOutbox`,
`reviews`, `reviewAggregates`, `productQuestions`, `cmsPages`,
`siteSettings`, `coupons`, `couponRedemptions`, `promotions` — fourteen
total. Every one follows the exact same Firestore Security Rules posture
as every Phase 1-6 collection: `allow read, write: if false`, real
enforcement is server-side-only Admin SDK access gated by `services/*`
(see `firestore.rules`'s Phase 7 comment block for why even a signed-in
customer's own data isn't scoped to `request.auth.uid` — there is no
client-side Firestore access anywhere in this app, authenticated or not).
Composite indexes for every multi-field query these collections'
repositories issue are in `firestore.indexes.json`.

### Security

- Customer and staff sessions are fully isolated (separate cookie,
  collection, and session-resolution service — see above), never sharing
  a permission-check code path.
- Every customer-facing write goes through `requireCustomerSession()` plus
  an ownership check scoped to `session.uid`/`session.email` — addresses,
  wishlist, reviews, back-in-stock subscriptions, Q&A.
- Rate limiting: customer register/login/forgot-password/resend-
  verification (IP + email, `config/customer-auth.ts`), review submission
  (per-customer, `config/reviews.ts`), question asking (per-customer,
  `config/questions.ts`), back-in-stock subscribe (per-IP,
  `config/customer-auth.ts`), and coupon application (per-cart-id — a
  Server Action has no request object to key an IP-based limit off,
  `config/pricing.ts`) — guards specifically against brute-forcing coupon
  codes via repeated "Apply" submissions.
- Every enumeration-sensitive lookup (a wishlist item, an address, a
  review, a subscription belonging to someone else; an invalid/expired
  back-in-stock unsubscribe token) returns the identical generic
  `NotFoundError`, never a distinguishing error.
- Public reads (CMS pages, reviews, Q&A) are hard-gated at the repository
  method level (`findPublishedBySlug`, `listApprovedByProduct`) — there is
  no method on any of these ports that can return a draft/pending/rejected
  row under any circumstance.
- CSRF/same-origin checks on every customer-auth Route Handler
  (`verifySameOriginRequest`, the same mechanism Phase 2's staff auth
  uses); every Server Action gets Next's built-in Origin/Host check.

### Emulator and e2e setup

`tests/e2e/customer-account.spec.ts` shares `playwright.auth.config.ts`'s
config with every prior phase's auth-backed spec, performing **exactly
one customer registration/login for its entire run** (register auto-logs
in) — the same shared-rate-limit-budget discipline
`admin-orders.spec.ts` documents, except against `config/customer-auth.ts`'s
separate customer-scoped rate-limit buckets, never the staff ones. It
seeds a CMS page and a coupon directly through the real Firestore
repositories (not the admin UI) for the same reason `storefront-
fixtures.ts` does — avoiding extra staff logins this run's shared budget
doesn't have room for.

### Known limitations

- Coupon usage is **not** released when an order is later cancelled or
  fails — `usageCount`/`couponRedemptions` reflect redemptions at
  checkout time only (documented above).
- Maintenance mode shows a banner; it does not gate storefront access.
- Site settings' footer columns, social links, header links, and payment
  logos are edited via structured line/JSON textareas in
  `/admin/site-settings`, not a drag-and-drop builder — an intentional
  "structured, not a visual page builder" simplification the spec itself
  calls for.
- No automated GDPR-style data deletion — `customer_data_deletion_requested`
  is audit-logged and the request is recorded, but nothing yet purges the
  underlying documents.
- Review/CMS image attachments are seams only (`Review.imageUrls: []`,
  always empty) — no upload UI exists yet.
- "Shop by use" (spec section 13, called out as optional) was not built —
  no catalog attribute exists to group by yet.
- E2E coverage for Phase 7 is one representative flow per major area
  (customer registration → wishlist → addresses, CMS page + footer link,
  coupon apply/reject) rather than one spec file per feature the way
  Phases 2-6 have — reviews, Q&A, back-in-stock, and admin moderation UI
  are covered by unit + Firestore-emulator integration tests only.
- `notificationOutbox`/`emailOutbox` `"failed"` entries have no automatic
  retry worker — the durable record exists for one to scan, same
  Phase 5-documented limitation.

### Future integration seams

- **Automated GDPR deletion**: `customerDataRequests`-style audit events
  already exist; wiring an actual purge job is additive.
- **Coupon usage release on cancellation**: `CouponRepository.redeem()`'s
  transactional shape is the same one a `release()` counterpart would use.
- **A dedicated `navigationConfig`/`homepageSections` split**: if
  `siteSettings` ever grows unwieldy as one document, `core/site-settings/
  entities.ts`'s consolidation doc comment is the starting point for
  splitting it back out.
- **Real image uploads for reviews/CMS**: `Review.imageUrls`/`CmsPage`
  already have the field shape; only the Storage upload path is missing.

## Phase 8 — Official Brand Identity, AI Admin Assistant, and Production Readiness

Two parts. First, a design-system-only swap: every temporary Phase
1 placeholder color/radius/shadow token is replaced with the official
Ninety Six Degrees Cafe brand (the logo's purple, the tropical-leaf
artwork's supporting palette), with zero changes to architecture,
routes, Firestore models, services, or business logic. Second, the
production-readiness features the brief asked for: an AI Admin
Assistant, admin-controllable payment providers, cash/online payment
reporting, a queue/retry worker for transactional email, a read-only
external-system integration feed, health checks, baseline security
headers, and centralized error logging.

### Brand identity

```
apps/web/public/brand/            logo-{wordmark,mark}-{purple,white,charcoal}.png, og-default.png
apps/web/src/app/{icon,apple-icon}.png, favicon.ico   Next.js auto-served icon convention
apps/web/src/app/globals.css      the entire design-token system (rewritten)
apps/web/src/ui/layout/logo.tsx           <Logo variant="wordmark"|"mark" color="purple"|"white"|"charcoal" />
apps/web/src/ui/layout/leaf-accent.tsx    <LeafAccent corner="..." /> — the one decorative motif, hero/empty-state only
```

- **Palette provenance**: primary purple sampled directly from the official
  logo PDF (`#52346a`, exact pixel value, used unmodified as the 600 step
  of an 11-step ramp); secondary teal and the success/warning/danger hues
  extracted from the official tropical-leaf artwork via hue-bucketed
  pixel-frequency analysis (not eyeballed); a purple-tinted (not plain
  gray) neutral ramp for background/surface/border/text — deliberately
  not the traditional brown coffee-shop palette the brief explicitly ruled
  out. Every semantic color passes WCAG AA contrast (≥4.5:1) against white.
- **Zero-touch token compatibility**: `--color-brand-*`/`--color-accent-*`
  (the ~150-file-referenced Phase 1 names) are kept as exact CSS-variable
  aliases of the new `--color-primary-*`/`--color-secondary-*` values — no
  component's `bg-brand-900`/`text-accent-600` class needed to change.
  `--color-success-*`/`--color-warning-*`/`--color-danger-*` are new;
  every raw Tailwind color utility that predated them (`text-red-600`,
  `bg-amber-100`, `bg-emerald-100`, etc. — 43 files, ~70 occurrences) was
  swept to the matching semantic token.
- **Logo usage**: `<Logo>` renders the official wordmark or standalone leaf
  mark, in the colorway that fits its background, in the header, footer,
  admin nav, and the root `global-error.tsx` boundary.
- **The tropical-leaf motif is used exactly twice, by design** (the brief
  says "do NOT overuse them"): the homepage hero's two `<LeafAccent>`
  corner-bleed accents (`features/storefront/home/hero.tsx`) and the
  shared `EmptyState` component's small centered mark (used wherever a
  storefront list/section has nothing to show).
- **Dark mode**: intentionally not themed (see `globals.css`'s doc
  comment) — no `dark:` Tailwind variant existed anywhere in the codebase
  before this phase, and a half-themed dark background with light-styled
  cards would look broken, not premium. Tracked as a Known limitation
  below, not silently dropped.
- Default site branding text (`SITE_NAME`, `defaultSiteSettings().storeName`,
  the pickup-location default, every email template's sign-off) now reads
  "Ninety Six Degrees Cafe" instead of the Phase 1 placeholder "96 Order".

### AI Admin Assistant

```
core/interfaces/ai-assistant-port.ts       AIAssistantPort, AdminAssistantContext (aggregate-only, no PII)
core/ai-assistant/format-context.ts        shared plain-text rendering both providers use
infrastructure/ai/anthropic-env.ts         hasAnthropicCredentials()/getAnthropicEnv() — same shape as Tap's env.ts
infrastructure/ai/anthropic-assistant-provider.ts   real provider, fetch to api.anthropic.com, no SDK dependency
infrastructure/ai/rule-based-assistant-provider.ts  always-available deterministic fallback
services/ai-assistant/ask-assistant.ts     permission + rate limit + context assembly + graceful fallback
app/admin/(protected)/ai-assistant/page.tsx, features/admin-ai-assistant/*
```

- Gated by `reports:view` (it's a natural-language view over the same
  aggregate data `/admin/reports` already shows, not a new capability) and
  rate-limited per admin (`AI_ASSISTANT_RATE_LIMIT`, 20 questions/15 min) —
  a real LLM call costs real money per request, unlike everything else
  this app rate-limits.
- **Strictly read-only, context-bounded, no tool access.** The model is
  only ever given `AdminAssistantContext` — dashboard counts, a 30-day
  sales bucket, orders-by-status, cash/online payment summaries, and up to
  25 pending-cash-collection rows — never raw customer records, and has no
  function-calling/tool access to change anything. The system prompt
  states this explicitly and instructs the model to say so rather than
  guess when a question falls outside the snapshot.
- **Provider selection mirrors `defaultPaymentDeps`'s Tap/Fake pattern**:
  `AnthropicAssistantProvider` (real, calls Claude) is used automatically
  when `ANTHROPIC_API_KEY` is set; otherwise `RuleBasedAssistantProvider`
  (a deterministic data-snapshot digest, always correct, never fabricated)
  runs instead — and if the live API call itself throws (timeout, bad
  response, rate limit on Anthropic's side), `askAdminAssistant` catches
  it and falls back to the same rules-based digest rather than failing the
  request. `generatedByAI: false` on the response tells the UI (and the
  admin) which one actually answered.
- No conversation memory/session state — every question is answered from
  a freshly assembled context, independently.

### Payment provider management

```
core/site-settings/entities.ts     PaymentProviderSettings, isPaymentMethodEnabled()
services/checkout/create-order.ts  server-side gate: rejects a disabled method/fulfillment combo
features/checkout/checkout-form.tsx   hides/reflows disabled options client-side, in real time
```

- Site Settings gains three independent switches: Tap (card), cash on
  delivery, cash on pickup — cash-on-delivery and cash-on-pickup are the
  same `PaymentMethod: "cash"` (see Phase 5) but different
  `OrderFulfillment.method`, so they're toggled separately.
- **Enforced server-side, not just hidden in the UI**: `createOrder` reads
  `SiteSettings.paymentProviders` and throws `ValidationError` before
  touching the idempotency ledger if the submitted method/fulfillment
  combination is off — a disabled provider can never be reached by a
  replayed or hand-crafted request, only by what the admin actually
  allows.
- Any `siteSettings` document saved before this field existed is missing
  it; every read path (`getPublicSiteSettings`, `getSiteSettingsForAdmin`,
  `createOrder`) treats a missing value as "every provider on" — the
  actual behavior before this field existed — rather than failing.

### Cash/online payment reports and the pending-cash worklist

```
core/reports/entities.ts    CashPaymentsSummary, OnlinePaymentsSummary, PendingCashCollectionRow
core/reports/rules.ts       computeCashPaymentsSummary(), computeOnlinePaymentsSummary()
services/reports/payments-report.ts
app/admin/(protected)/reports/page.tsx   three new sections alongside Sales/Best sellers/Orders by status
```

- **Cash payments**: pending-vs-confirmed counts and totals, split by
  delivery vs pickup, over the same date range as the rest of `/admin/reports`.
- **Online (Tap) payments**: paid/refunded totals plus pending/authorized/
  failed/cancelled counts.
- **Pending cash collection**: not a date-bucketed report like the two
  above — a live, oldest-first worklist of every still-`cash_pending`
  order (reusing the existing `paymentStatus + createdAt` Firestore
  index from Phase 6's order list filters), each row linking straight to
  `/admin/orders/[orderId]` to confirm cash, cancel, or release the
  reservation.
- **The order confirm/cancel/release-reservation admin actions and their
  audit logging already existed from Phase 5/6** — Phase 8 only adds the
  reports and provider toggles on top of already-working mechanics; see
  `services/payments/confirm-cash-payment.ts`,
  `services/orders/release-order-reservation.ts`, and
  `OrderActionsPanel`'s "Confirm cash payment"/"Release reservation"/
  "Cancel order" buttons.

### Integrations, queue, and retry

```
lib/verify-job-secret.ts                      shared-secret auth for machine-to-machine routes (JOB_SECRET)
services/email/retry-failed-emails.ts         drains EmailOutboxRepository.listRetryable()
services/integrations/daily-order-sync.ts     read-only order feed for an external ERP
app/api/jobs/retry-failed-emails/route.ts     POST, JOB_SECRET-protected
app/api/integrations/orders/sync/route.ts     GET ?from=&to=, JOB_SECRET-protected
app/admin/(protected)/integrations/page.tsx   config status + manual "retry now" trigger
```

- **Email retry worker**: `EmailOutboxRepository` gains
  `listRetryable(maxAttempts, limit)` (least-retried-first, backed by a
  new `status + attempts + updatedAt` Firestore composite index) —
  `retryFailedEmails()` drains up to `EMAIL_RETRY_BATCH_LIMIT` (50)
  still-failing entries per call and re-attempts delivery, same
  sent/failed bookkeeping the original send uses. This is the retry
  worker `core/interfaces/email-outbox-repository.ts` was designed for
  since Phase 5 but never had.
- **Daily order sync API**: `GET /api/integrations/orders/sync` returns
  every order created in `[from, to]` (default: the last 24 hours) in a
  stable `OrderSyncRow` shape (deliberately not `Order` itself, so an
  internal schema change can never silently break an external
  integration) — meant to be polled once a day by an external ERP/
  inventory system. Bounded by `ORDER_SYNC_MAX_RESULTS` (1000); a busier
  store should narrow `from`/`to` rather than expect a cursor this
  endpoint doesn't provide.
- **No real external ERP is integrated** — this is the read-only feed
  such a system would poll, not a live integration with one. "Optional
  external ERP/System integration" from the brief is satisfied as an
  available seam, not a fabricated connection to a system that doesn't
  exist in this environment.
- Both job routes authenticate via `Authorization: Bearer <JOB_SECRET>`
  (`lib/verify-job-secret.ts`, constant-time comparison), never an admin
  session — they're meant to be called by a scheduler or an external
  system, not a browser. **Disabled by default**: every job route denies
  every request when `JOB_SECRET` isn't set, the same
  "credential-absence-means-off" precedent `hasTapCredentials()`
  established in Phase 5.
- `/admin/integrations` (gated by the `integrations:view`/`integrations:manage`
  permission namespace, reserved since Phase 2) shows which optional
  credentials are configured — presence only, never values — and lets an
  admin manually trigger the email retry worker without waiting for the
  next scheduled run.
- Neither job route is on an automatic schedule yet — see Backlog.

### Health checks and error monitoring

- `GET /api/health` — unauthenticated (this is what a load balancer/
  uptime monitor hits), checks Firestore reachability with a 5s-bounded
  read, returns `{ status: "ok"|"degraded", checks: { firestore } }` and
  HTTP 200/503. Deliberately returns only pass/fail booleans, never error
  text, so it can't be used to fingerprint internals.
- `src/instrumentation.ts` registers Next.js's `onRequestError` hook —
  every uncaught Server Component/Route Handler/Server Action error now
  also logs through the existing structured `logger.error` JSON output
  (already Cloud-Logging-compatible on a real deployment), independent of
  whatever that code path already does with the error. This is the one
  centralized point a real third-party sink (Sentry, Cloud Error
  Reporting) would plug into — see Backlog.

### Security hardening

- `next.config.ts` now sends baseline security headers on every response:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (camera/microphone/geolocation all denied), and
  `Strict-Transport-Security` (2-year max-age, includeSubDomains, preload).
- **Deliberately no `Content-Security-Policy`** — this app's real resource
  mix (Firebase Storage images, the Google Identity Toolkit client SDK,
  Next's own hydration script injection) needs a carefully tuned,
  per-directive CSP that's easy to get subtly wrong without a staging
  rollout to verify against; shipping an under-tested CSP risks silently
  breaking pages rather than hardening them. Tracked in Backlog as a
  scoped follow-up, not skipped silently.
- Rate limiting reviewed: every existing limiter (`sessionCreateByIp/Email`,
  `forgotPasswordByIp/Email`, back-in-stock subscribe) is unchanged and
  still in force; the new AI Assistant adds its own per-admin limiter
  (`AI_ASSISTANT_RATE_LIMIT`) since it's the first endpoint whose cost is
  per-call money, not just abuse risk.
- **App Check and Secret Manager are ops/GCP-console configuration, not
  application code** — this repository has no GCP project to configure
  App Check attestation or Secret Manager bindings against, so neither is
  wired here; see the Production checklist below for what enabling them
  in a real deployment involves, and Backlog for the App Check tracking
  item carried over from Phase 2.

### Production checklist

Concrete, in order, for taking this repository to a live deployment:

1. **Firebase project**: create/select a production Firebase project;
   enable Firestore (production mode), Authentication (Email/Password),
   and Storage. Deploy `firestore.rules`/`firestore.indexes.json`
   (`firebase deploy --only firestore`) and `storage.rules`.
2. **Secrets**: set `TAP_SECRET_KEY` (live Tap key, once verified against
   a real Tap sandbox — see Backlog), `ANTHROPIC_API_KEY` (optional — the
   AI Assistant degrades gracefully without it), and `JOB_SECRET` (a
   long random value) in your hosting platform's environment/Secret
   Manager, never committed. Rotate `JOB_SECRET` by updating it in both
   the platform and whatever scheduler calls the job routes.
3. **App Check**: enable Firebase App Check (reCAPTCHA Enterprise or
   similar) on the Firebase project and enforce it for Firestore/Auth —
   an additional bot/device-attestation layer on top of, not instead of,
   this app's own rate limiting.
4. **Bootstrap the first super admin**: `pnpm run bootstrap:super-admin`
   against the production project (see Getting started above).
5. **Deploy the web app** (Vercel or any Next.js-capable host) with
   `NEXT_PUBLIC_FIREBASE_*` pointed at the production project and
   `NEXT_PUBLIC_SITE_URL` set to the real domain (used by `sitemap.xml`,
   `robots.txt`, and every canonical/OG URL).
6. **Health check wiring**: point your host's/load balancer's health
   check at `GET /api/health`; alert on repeated 503s.
7. **Schedule the two job routes** (`POST /api/jobs/retry-failed-emails`,
   and the existing `services/inventory/expire-reservations.ts` sweep —
   wire it to a route the same way if one doesn't exist yet) via Cloud
   Scheduler or equivalent, both authenticated with `JOB_SECRET`.
8. **CSP**: before enabling a strict `Content-Security-Policy`, audit every
   real external resource this deployment actually loads (Firebase
   Storage bucket, any CDN) and test in staging — see Security hardening
   above for why this wasn't shipped pre-tuned.
9. **Verify Tap** against a real sandbox/live account (field names/status
   strings — see Backlog) before taking real payments.
10. Point an uptime monitor and a real error-monitoring sink (see
    "Health checks and error monitoring" above) at the deployment.

### Backup strategy

- **Firestore**: enable [scheduled backups](https://firebase.google.com/docs/firestore/backups)
  (`gcloud firestore backups schedules create`) at a daily cadence with a
  retention window matching your compliance/ops needs (e.g. 30 days) —
  this is a GCP-console/CLI configuration against the production project,
  not something this repository can pre-configure without one. Test a
  restore into a scratch project at least once before relying on it.
- **Storage**: Firebase Storage buckets can enable
  [Object Versioning](https://cloud.google.com/storage/docs/object-versioning)
  for the product-image bucket, giving point-in-time recovery of
  accidentally-overwritten/deleted images independent of the Firestore
  backup above.
- **Audit trail as a secondary source of truth**: every mutating action
  in this app already writes an append-only `auditLogs`/`orderEvents`
  entry (Phase 2 onward) — while not a substitute for real backups, it
  means a corrupted document's history of changes is independently
  reconstructable.
- No automated backup-verification job exists in this repository (it
  would need to run against real GCP infrastructure this environment
  doesn't have) — tracked as an ops runbook item, not application code.

### Load testing

- No load test suite is included in this repository — realistic load
  testing needs a real deployed environment (a local Firestore emulator's
  performance characteristics don't represent production Firestore) and
  is an ops exercise, not something to fabricate against a sandbox.
- **Recommended approach once deployed to staging**: [k6](https://k6.io/)
  or [Artillery](https://www.artillery.io/) against the read-heavy
  storefront paths first (`/`, `/products`, `/products/[slug]`, `/search`
  — all backed by `unstable_cache`, see `services/storefront/cache.ts`),
  then the checkout write path (`createOrder`) at a realistic order rate,
  watching Firestore's per-second write budget and the
  `REPORT_SCAN_LIMIT`/`ORDER_SYNC_MAX_RESULTS` bounded-scan limits called
  out throughout this README as the points most likely to need
  revisiting at higher volume.
- The application-level rate limiters (`config/auth.ts#RATE_LIMITS`,
  `AI_ASSISTANT_RATE_LIMIT`, back-in-stock subscribe) will themselves
  throttle a naive load test that doesn't vary IP/email/actor — a real
  load test needs to account for this rather than read it as a
  performance ceiling.

### Known limitations

- Dark mode is not themed (see Brand identity above) — a deliberate
  scope decision, not an oversight.
- No `Content-Security-Policy` header (see Security hardening above).
- Neither job route (`retry-failed-emails`, the Phase 6 reservation
  sweep) is on an automatic schedule — both are working, callable
  endpoints/actions, wiring Cloud Scheduler to call them is an ops step
  (see Production checklist).
- The AI Admin Assistant has no conversation memory and cannot take any
  action — it answers from a fresh, read-only data snapshot every time.
- The daily order sync API is a read-only feed, not a real ERP
  integration — no external ERP exists to integrate with in this
  environment.
- App Check, Secret Manager, and a real load test all require a live GCP
  project this environment doesn't have — see the Production checklist
  for exactly what enabling each involves.
- `TapPaymentProvider`'s field names/status strings are still unverified
  against a real Tap sandbox account (carried over from Phase 5).

### Future integration seams

- **A third-party error-monitoring sink**: `src/instrumentation.ts`'s
  `onRequestError` is the one place a Sentry/Cloud-Error-Reporting SDK
  call would be added.
- **A real Content-Security-Policy**: `next.config.ts`'s `headers()` is
  where the `Content-Security-Policy` entry would join the existing
  security headers, once tuned against this deployment's actual resource
  list.
- **Cloud Scheduler-driven job routes**: both `/api/jobs/*` routes already
  do the work; only the recurring trigger is missing.
- **A real ERP consuming `/api/integrations/orders/sync`**: the response
  shape (`OrderSyncRow`) is intentionally decoupled from `Order` so the
  integration contract can stay stable independent of internal schema
  changes.
- **Tool-calling for the AI Assistant**: `AIAssistantPort`/`AdminAssistantContext`
  are read-only by design today; if a future phase wants the assistant to
  take actions, that would be a deliberate, separately-reviewed expansion
  of scope — not something to add casually to a context object that
  currently guarantees "never acts."

## Backlog (ideas noted, not implemented)

- Firebase App Check / reCAPTCHA in front of Identity Platform, as an
  additional bot/device-attestation layer on top of the application-level
  rate limiter documented above (not a replacement for it).
- Split `staff:assign_roles` from role-definition permissions, narrowing
  what a `staff:manage` holder can do to the `super_admin` role's neighbors.
- Denormalize `effectivePermissions` onto `users/{uid}` if role/user counts
  grow enough that the current per-request resolution's N+1 role reads
  become a real latency/cost concern.
- A safe super-admin demotion-to-zero workaround (re-authentication and/or
  multi-approval) for the rare legitimate case of intentionally retiring
  the very last super admin account.
- Turborepo build caching once the package count grows.
- Feature-flag system (e.g. Firebase Remote Config).
- Multi-tenant `tenantId` partitioning strategy — decide when the first
  tenant-aware feature is designed.
- i18n / multi-language support.
- Storybook catalog for `ui/primitives`.
- A real third-party error-monitoring sink (Sentry, Cloud Error Reporting)
  wired into `src/instrumentation.ts`'s `onRequestError` hook — Phase 8
  centralizes every server error through structured `logger.error` JSON
  (already picked up by Cloud Logging on a real deployment), but no
  external dashboard/alerting integration exists yet.
- Analytics (GA4 / PostHog) — Phase 8's admin-facing reports (sales, best
  sellers, cash/online payments) are store-operations analytics, not
  storefront visitor/behavior analytics.
- Edge middleware for auth session refresh + RBAC route guards (once auth exists).
- Secret Manager wiring for `TAP_SECRET_KEY`/`ANTHROPIC_API_KEY`/`JOB_SECRET`
  — Phase 8 reads these from `process.env` the same way `.env.example`
  documents every other secret; moving them into GCP Secret Manager with
  the Firebase Admin SDK's Secret Manager integration at deploy time is
  ops configuration, not an application code change (see Phase 8's
  Production checklist).
- Product image download-token rotation/expiry, if these URLs are ever
  exposed anywhere less controlled than the admin UI.
- A separate `variants` collection, if any product family's variant count
  grows large enough that embedding stops being the right tradeoff.
- Category/brand `imageRef`/`logoRef` asset-picker UI wired to actual
  Storage uploads (currently placeholder string fields only).
- Drag-and-drop product image reordering in the admin UI.
- A denormalized `isLowStock` flag on `InventoryRecord` (or a dedicated
  low-stock index), if `listLowStock()`'s bounded in-memory scan stops
  scaling with catalog size.
- Real tax/currency/pricing-rule engine behind `taxClass`/`costPrice`.
- Wholesale price-list and ERP sync collections referencing `productId`/
  `variantId`.
- Real relevance-ranked/fuzzy search via an external engine (Algolia,
  Typesense, Meilisearch) — see Phase 4's Search strategy for the exact
  seam this would replace.
- Per-product barcode-exposure control, so `PublicProduct.barcode` could
  be populated for products explicitly marked safe to show publicly.
- Per-slug (rather than entity-kind-level) storefront cache invalidation,
  if Phase 4's coarser tags stop being precise enough at scale.
- A paginated (not 60-item-bounded) sitemap generator, if the catalog
  grows past what a single bounded page can represent.
- Automated accessibility auditing (axe-core or similar) in CI, beyond
  Phase 4's targeted role/label/alt-text e2e assertions.
- Refund execution against Tap's refund API — `PaymentStatus.refunded` is
  modeled, nothing calls it yet.
- WhatsApp order/payment notifications, if an approved provider becomes
  available (email is Phase 5's only channel).
- ~~A background worker retrying `"failed"` `emailOutbox` entries with
  backoff.~~ Built in Phase 8 — `services/email/retry-failed-emails.ts`,
  exposed at `POST /api/jobs/retry-failed-emails`. Still backlog: wiring
  an actual Cloud Scheduler (or similar) trigger to call it automatically
  — see the next item, which now applies to both workers.
- A Cloud Scheduler trigger for the already-built expired-reservation
  sweep (`services/inventory/expire-reservations.ts`, Phase 6) and for the
  email retry worker (`POST /api/jobs/retry-failed-emails`, Phase 8) — both
  are working, callable jobs (the reservation sweep as an admin action, the
  email worker as a `JOB_SECRET`-protected route), just not on an automatic
  schedule yet; wiring Cloud Scheduler (or GitHub Actions cron) to call
  them periodically is ops configuration, not an application change.
- Bulk admin order actions (bulk status change, bulk export) — Phase 6
  ships one-order-at-a-time actions only.
- CSV/PDF export for orders, customers, and reports.
- A maintained rolling revenue total (or a verified `sum()` aggregation
  query) once order volume approaches the bounded-scan limits
  `services/reports/*`/`get-dashboard-stats.ts` currently accept — see
  Phase 6's Known limitations.
- Order search by delivery address, SKU, or in-order product name — Phase
  6's order search covers order number/customer name/email/mobile only.
- Verify `TapPaymentProvider`'s exact field names/status strings against a
  real Tap sandbox account before processing a live payment.
- Multiple admin-configurable pickup locations (`pickupLocations`
  collection) — Phase 5 ships one fixed location via `config/pickup.ts`.
- Real multi-currency support — `Money`/`CurrencyCode` already seam for
  it, only `BHD` is ever constructed today.
- Automated coupon-usage release when an order is later cancelled or
  fails — Phase 7's `usageCount`/`couponRedemptions` only ever increment.
- Automated GDPR-style customer data deletion — the request/audit-event
  seam exists (Phase 7), nothing purges the underlying documents yet.
- Real image upload UI for review attachments and CMS page assets —
  `Review.imageUrls` is a seam only (always empty).
- A visual/drag-and-drop editor for site settings' footer columns, social
  links, header links, and payment logos — Phase 7 ships structured
  line/JSON-textarea editing, deliberately not a page builder.
- "Shop by use" homepage section/catalog attribute (spec-noted as
  optional) — no catalog attribute exists to group products by yet.
- A background worker retrying `"failed"` `notificationOutbox` entries
  with backoff — mirrors the existing `emailOutbox` retry-worker backlog
  item above.
- Splitting `siteSettings` back into separate `navigationConfig`/
  `homepageSections` collections if the single consolidated document ever
  becomes unwieldy — see Phase 7's CMS/site-settings section for the
  consolidation rationale.
- Per-slug/per-review CMS and review moderation e2e coverage — Phase 7's
  e2e suite covers one representative flow per major area; reviews, Q&A,
  back-in-stock, and admin moderation UI rely on unit + integration tests
  only.
