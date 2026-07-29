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

Two narrow, deliberate exceptions were added in Phase 2, both only to
`lib`: `lib` may import `core` (so `lib/action-result.ts` can map thrown
`AppError`s to a typed Server Action result) and `lib` may import
`infrastructure` (so `lib/firebase-client-auth.ts` can wrap the Firebase
**client** Auth SDK singleton for browser-side use by
`features/admin-auth`'s client components — a browser SDK call, not a
Firestore/Admin SDK access, so this doesn't weaken "UI and routes must not
directly access Firestore or Firebase Admin"). `features`/`ui`/`app` still
cannot import `infrastructure` directly.

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

- **Login** (`/admin/login`, public): a client component calls the Firebase
  client SDK's `signInWithEmailAndPassword` directly against Identity
  Toolkit (never our server), then POSTs the resulting ID token to
  `POST /api/auth/session`.
- **Session creation** (`services/auth/create-session.ts`): rate-limits by
  IP and by email, verifies the ID token via the Admin SDK, confirms the
  uid has an **active** `users/{uid}` staff record (a valid Firebase Auth
  account alone is not authorization), mints a session cookie via
  `createSessionCookie`, records `lastLoginAt`, and writes a
  `login_success`/`login_failure` audit log entry.
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
  password: the Auth user is created with none, and a password-setup link
  (`generatePasswordResetLink`) is returned once to the creating admin —
  see the email-delivery limitation below.
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

### Security assumptions (read this before relying on rate limiting)

- **CSRF**: `/api/auth/session` and `/api/auth/forgot-password` (the only
  public, pre-auth, state-changing routes) check `Origin` against the
  request's own `Host` header (`lib/csrf.ts`) — deliberately not against
  `new URL(request.url).origin`, which under `next start` can report a
  normalized hostname that doesn't match the `Host` the client actually
  sent, which would make every legitimate request look cross-origin.
  Authenticated mutations use Server Actions, which Next.js already
  protects with its own Origin/Host check on every invocation.
- **Rate limiting has a real, documented scope limit**:
  `signInWithEmailAndPassword` and `sendPasswordResetEmail` are Firebase
  client-SDK calls that talk to Identity Toolkit directly — they never
  touch our server. The Firestore-backed rate limiter
  (`infrastructure/firebase/repositories/firestore-rate-limiter.ts`) only
  throttles what actually reaches our backend: session-cookie creation and
  the forgot-password gate. It does **not** throttle raw password-guessing
  against Firebase Auth itself. If that's needed, Firebase App Check /
  reCAPTCHA in front of Identity Platform is the real fix — see Backlog.
- **No transactional email service in this stack.** `generatePasswordResetLink`
  (Admin SDK) creates a valid reset URL but does not deliver it — there is
  no server-side "send email" API. `create-staff` and
  `initiate-password-reset` return the link once for the admin to relay
  manually; the public `/admin/forgot-password` flow instead calls the
  client SDK's `sendPasswordResetEmail` (Firebase's own hosted delivery)
  after our server-side rate-limit gate succeeds. A determined caller could
  skip that gate and call `sendPasswordResetEmail` directly from the
  browser — the same inherent limitation applies to `signInWithEmailAndPassword`
  above. Enable "Email Enumeration Protection" in the Firebase Auth console
  so the response never reveals whether an account exists either way.
- **`rateLimits/{key}` has no automatic expiry wired up.** A Firestore TTL
  policy needs to be configured out-of-band (not expressible in
  `firebase.json`): `gcloud firestore fields ttl-policies create --collection-group=rateLimits --field=expiresAt --database='(default)'`.
  The `expiresAt` field is already written; this command just needs to be
  run once against your real project.

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

- Rate limiting doesn't cover client-SDK-direct calls (see Security
  assumptions above) — accepted for this phase, App Check noted in Backlog.
- No automated Firestore TTL policy for `rateLimits` — one manual `gcloud`
  command, documented above, not yet run against a real project.
- No super-admin demotion path — a `super_admin` role can only be added to
  an account, never removed, in Phase 2.
- `staff:manage` is a broad, near-super-admin-trust permission (see RBAC
  model above) — a narrower split is Backlog, not yet built.
- Password-reset/staff-invite links are relayed manually by the admin who
  triggered them; there's no transactional email integration yet.

## Backlog (ideas noted, not implemented)

- Firebase App Check / reCAPTCHA in front of Identity Platform, for actual
  brute-force protection on login (the Firestore rate limiter's real,
  documented scope is narrower — see Phase 2's security assumptions).
- Split `staff:assign_roles` from role-definition permissions, narrowing
  what a `staff:manage` holder can do to the `super_admin` role's neighbors.
- Denormalize `effectivePermissions` onto `users/{uid}` if role/user counts
  grow enough that the current per-request resolution's N+1 role reads
  become a real latency/cost concern.
- A safe super-admin demotion path (re-authentication and/or
  multi-approval), once more than one super admin exists in practice.
- Transactional email provider (e.g. via a Cloud Function trigger) so
  staff-invite and password-reset links are delivered automatically instead
  of relayed manually by the triggering admin.
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
