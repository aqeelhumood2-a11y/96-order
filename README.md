# 96 Order — Premium Coffee & Equipment E-commerce Platform

A production-grade, enterprise e-commerce platform for coffee beans, coffee
products, brewing equipment, machines, grinders, filters, accessories, and
related supplies — built phase by phase on Clean Architecture so every
future module (catalog, admin, CMS, auth/RBAC, orders, ERP, POS, wholesale,
multi-tenant, ...) plugs in without restructuring what already exists.

**Stack:** Next.js (App Router) · React · TypeScript · Firebase (Firestore,
Auth, Storage, Cloud Functions) · Tailwind CSS · GitHub · Vercel.

This document covers Phase 1 (Foundation): the skeleton every later phase
builds inside of. No business features exist yet.

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
features/         Vertical slices (one folder per feature). Phase 1 has only `home` (a placeholder).
services/         Use-case orchestration. Depends on core's interfaces, wires in infrastructure.
infrastructure/   Concrete adapters (Firebase client/admin SDK, Firestore repositories) implementing core's ports.
ui/               Design system: Radix-based primitives (ui/primitives) and layout shells (ui/layout). No business logic.
lib/              Cross-cutting utilities: env validation, logger, className helper.
config/           Code-level constants (not CMS content — CMS is a later phase).
types/            Shared ambient/global types.
```

The dependency direction is enforced by `eslint-plugin-boundaries`
(`apps/web/eslint.config.mjs`): `core` cannot import from any outer layer,
`ui` cannot import business logic, and `features`/`app` cannot reach into
`infrastructure` directly — they go through `services`. Run `pnpm lint` to
see it in action; violating the rule is a lint error, not a suggestion.

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
| `pnpm run test` | Runs Vitest unit tests in every workspace package |
| `pnpm run test:e2e` | Runs the Playwright smoke tests against a production build |
| `pnpm run emulators` | Starts the Firebase Emulator Suite |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, the build,
and the Playwright suite on every push and pull request. It does not deploy
anything — deploy wiring is a later-phase concern.

## Security baseline

- `firestore.rules` and `storage.rules` default-deny **everything**. No
  collection or storage path is opened up until its real access pattern is
  designed in the phase that introduces it — the safest and cheapest
  starting point for both security and Firestore read/write cost.
- No secrets are committed anywhere in this repo; `.gitignore` covers `.env*`
  and any file matching `*service-account*`/`*serviceAccountKey*`.
- Images are restricted in `next.config.ts` to this project's own Firebase
  Storage bucket (via `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`) — no wildcard
  remote hosts.

## Out of scope for Phase 1

Authentication flows, RBAC, product catalog, admin panel, CMS, orders,
payments, shipping, any real Firestore collections, and any page beyond the
minimal landing shell. Phase 1 only prepares the seams these plug into.

## Backlog (ideas noted, not implemented)

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
