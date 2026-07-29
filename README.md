# 96 Order — Premium Coffee & Equipment E-commerce Platform

A production-grade, enterprise e-commerce platform for coffee beans, coffee
products, brewing equipment, machines, grinders, filters, accessories, and
related supplies — built phase by phase on Clean Architecture so every
future module (catalog, admin, CMS, auth/RBAC, orders, ERP, POS, wholesale,
multi-tenant, ...) plugs in without restructuring what already exists.

**Stack:** Next.js (App Router) · React · TypeScript · Firebase (Firestore,
Auth, Storage, Cloud Functions) · Tailwind CSS · GitHub · Vercel.

**Status:** Phase 1 (Foundation) and Phase 2 (Authentication, Admin Access &
RBAC) are complete. No catalog, orders, CMS, payments, or other business
modules exist yet — Phase 2 built the auth/RBAC foundation those modules
will sit behind, not the modules themselves.

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
| `pnpm run test:integration` | Firestore adapter + security-rules tests against the Emulator Suite (`firebase emulators:exec`) |
| `pnpm run test:e2e` | Playwright smoke test against a production build (no emulator) |
| `pnpm run test:e2e:auth` | Playwright auth/RBAC e2e suite against the Emulator Suite |
| `pnpm run emulators` | Starts the Firebase Emulator Suite |
| `pnpm run bootstrap:super-admin` | One-time super-admin bootstrap — see below |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, integration
tests, the build, and both Playwright suites on every push and pull request.
It does not deploy anything — deploy wiring is a later-phase concern.

## Security baseline

- `firestore.rules` and `storage.rules` default-deny **everything** except
  explicit, narrow rules for the Phase 2 collections (`users`, `roles`,
  `auditLogs`, `system`, `rateLimits`), which are also deny-all — see
  Phase 2's data model section for why. No other collection or storage path
  is opened up until its real access pattern is designed in the phase that
  introduces it.
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
- Error monitoring (Sentry or similar).
- Analytics (GA4 / PostHog).
- Edge middleware for auth session refresh + RBAC route guards (once auth exists).
- Secret Manager wiring for the first server-side secret an integration needs.
