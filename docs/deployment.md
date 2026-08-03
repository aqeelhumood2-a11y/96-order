# Production deployment guide

This is the concrete, ordered path from this repository to a live
production deployment. Every step here is an infrastructure/ops action
against a real Firebase/GCP project and hosting platform — none of it can
be pre-configured inside this repository, since none of that infrastructure
exists in a code sandbox.

## 0. Prerequisites

- A Firebase project (separate from any dev/staging project).
- A domain you control, with access to its DNS.
- A Tap Payments merchant account (for live card charges).
- An SMTP-capable email provider (Amazon SES, SendGrid, Postmark, Mailgun, or similar).
- Access to your hosting platform's environment/secret manager (Vercel, Cloud Run, Firebase App Hosting, etc.).

## IAM permissions

Verify these before going live — an over-permissioned service account is a
real production risk, not a formality:

- **Hosting platform's default service account** (what runs the deployed
  app and thus the Firebase Admin SDK): needs `roles/datastore.user`
  (Firestore read/write), `roles/firebaseauth.admin` (session cookie
  verification, user lookup for `bootstrap:super-admin`-created accounts),
  and `roles/storage.objectAdmin` scoped to the product-image bucket only
  — not project-wide Storage admin.
- **Whoever runs `pnpm run bootstrap:super-admin`**: the same three roles,
  temporarily, from a trusted machine only — this script is a one-time
  setup action, not something CI should ever run.
- **Cloud Scheduler's own service account** (if using `ops/setup-cloud-scheduler.sh`
  as-is, which authenticates via the `JOB_SECRET` header, not IAM): no
  special IAM role needed beyond `roles/cloudscheduler.admin` for whoever
  *provisions* the jobs. If you instead switch the jobs to OIDC/IAM-based
  auth against a Cloud Run service, grant only `roles/run.invoker` on that
  specific service, not project-wide.
- Avoid `roles/owner`/`roles/editor` on any service account this app
  actually runs as — grant the specific roles above instead.

## 1. Firebase project setup

```bash
firebase projects:create <your-production-project-id>   # or select an existing one
firebase use <your-production-project-id>
```

- Enable **Firestore** (Native mode, production/standard edition — not the test-mode 30-day rule).
- Enable **Authentication** → Email/Password provider.
- Enable **Storage**.
- Deploy the rules and indexes this repository already defines:
  ```bash
  firebase deploy --only firestore:rules,firestore:indexes,storage
  ```
  `firestore.rules`/`storage.rules` deny all client SDK access by design
  (see the root README's Security baseline) — this deploy step is what
  actually enforces that in production; skipping it leaves Firestore on
  its default (also deny-all for a fresh project, but don't rely on the
  default — deploy explicitly).

## 2. Firebase Authentication configuration (console)

- **Authorized domains** (Authentication → Settings → Authorized domains):
  add your production domain. Firebase's hosted password-reset email
  (`services/auth/request-password-reset.ts` triggers it server-side) links
  back to whatever domain is authorized here — an unauthorized domain
  breaks the reset-password flow silently.
- **Email Enumeration Protection** (Authentication → Settings): enable it.
  This app's own login/forgot-password responses are already
  timing-safe and enumeration-resistant at the application layer (see
  `services/auth/create-session.ts`'s doc comment) — this setting closes
  the same gap at the Identity Toolkit API level itself, defense in depth.
- Customize the password-reset email template's branding if desired
  (Authentication → Templates) — this is Firebase's own hosted email,
  separate from this app's SMTP-delivered transactional emails.

## 3. Firebase App Check

- Console → App Check → register your web app, using reCAPTCHA Enterprise
  (recommended) or reCAPTCHA v3.
- Enforce App Check for Firestore and Authentication once you've verified
  legitimate traffic isn't being blocked (App Check has a monitoring-only
  mode — use it first, then switch to enforced).
- This is an additional bot/device-attestation layer **on top of**, not
  instead of, this app's own rate limiting (`config/auth.ts#RATE_LIMITS`,
  `AI_ASSISTANT_RATE_LIMIT`, back-in-stock subscribe) — both stay in force
  together.

## 4. Secrets

Set every variable in [environment-variables.md](./environment-variables.md)
through your hosting platform's secret manager. On Vercel: Project Settings
→ Environment Variables (mark secrets as "Sensitive"). On Cloud Run/Firebase
App Hosting: bind each to a Secret Manager secret (see below) rather than a
plain env var where the platform supports it.

### Moving secrets to Google Secret Manager

```bash
for name in TAP_SECRET_KEY ANTHROPIC_API_KEY SMTP_PASSWORD JOB_SECRET; do
  echo -n "<the real value>" | gcloud secrets create "$name" \
    --project=<your-production-project-id> --data-file=-
done
```

Then reference each secret by name in your hosting platform's config
instead of pasting the raw value — the exact binding mechanism depends on
the platform (Cloud Run: `--set-secrets`; Firebase App Hosting: `apphosting.yaml`'s
`env` with `secret:`; Vercel: secrets aren't native, so use Vercel's own
encrypted env vars, which serve the same purpose for that platform).
`TAP_SECRET_KEY`/`ANTHROPIC_API_KEY`/`SMTP_*`/`JOB_SECRET` are the only
application secrets this repo has today — Firebase Admin access itself
uses your hosting platform's default service account (Application Default
Credentials), never a service-account JSON in an env var at all.

## 5. Bootstrap the first super admin

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/prod-service-account.json \
  pnpm run bootstrap:super-admin -- --email you@example.com --password '...'
```

Use a real, unique password; change it after first login if you generated
a temporary one. This script talks directly to the production Firestore/
Auth via Application Default Credentials — run it once, from a trusted
machine, never from CI.

## 6. Domain, SSL, and redirects

- Point your domain's DNS at your hosting platform per its instructions
  (Vercel: CNAME/A records via the dashboard; Cloud Run: a Cloud Load
  Balancer + managed SSL certificate).
- Every modern hosting platform (Vercel, Cloud Run with a managed cert,
  Firebase Hosting) provisions and renews SSL automatically — verify the
  certificate is valid and auto-renewing, not self-signed or expired.
- **HTTPS everywhere**: `Strict-Transport-Security` (2-year max-age,
  includeSubDomains, preload — see `next.config.ts`) is already sent on
  every response; combined with your platform's automatic HTTP→HTTPS
  redirect (on by default on Vercel/Cloud Run/Firebase Hosting), this
  means no plain-HTTP page is ever served after the first visit. Verify
  the redirect explicitly:
  ```bash
  curl -sI http://your-domain.com/ | head -5   # expect a 301/308 to https://
  ```
- **www vs. apex**: decide which is canonical (this app doesn't care
  either way — `NEXT_PUBLIC_SITE_URL` just needs to match whichever you
  pick) and configure a redirect from the other at the DNS/platform level.
- **Canonical URLs**: already correct at the application level —
  `services/storefront/seo.ts#absoluteUrl` builds every canonical/OG URL
  from `NEXT_PUBLIC_SITE_URL`. Verify it's actually set to the real
  domain (see [environment-variables.md](./environment-variables.md)); if
  it's left at the `localhost:3000` fallback, every canonical tag,
  sitemap entry, and Open Graph URL will be wrong even though the site
  itself works fine.

## 7. Build and deploy the app

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Deploy via your platform's standard flow (`vercel deploy --prod`, a Cloud
Run revision, `firebase deploy --only hosting` with App Hosting, etc.).
`next.config.ts`'s `headers()` (security headers) and `src/middleware.ts`
(CSP nonce, admin-cookie redirect) apply automatically — no separate
platform-level header configuration needed.

## 8. Payments: Tap sandbox → live

- Verify against Tap's sandbox first (a real sandbox merchant account, not
  `FakeTapProvider`) — confirm `infrastructure/payments/tap/tap-payment-provider.ts`'s
  field names/status strings actually match what Tap's real API returns
  (this was never verified against a live account during development —
  see the root README's Known limitations).
- Register your production webhook URL in the Tap dashboard:
  `https://your-domain.com/api/payments/tap/webhook`.
- Register the checkout return URL your `returnUrl` param points browsers
  back to (already built correctly by `services/checkout/create-order.ts`
  from `NEXT_PUBLIC_SITE_URL` — verify that's the real domain).
- Switch `TAP_SECRET_KEY` from your sandbox key to your live key only
  after the above is verified end-to-end in sandbox.

## 9. Scheduled jobs

Run `ops/setup-cloud-scheduler.sh` (see its header comment for usage) to
provision the three Cloud Scheduler jobs this app's background workers
need. See [monitoring.md](./monitoring.md) for what each job does and how
to verify it's actually running.

## 10. Post-deploy verification

- [ ] `curl https://your-domain.com/api/health` returns `{"status":"ok",...}` with HTTP 200.
- [ ] Log in to `/admin/login` with the bootstrapped super admin.
- [ ] `/admin/integrations` shows every credential you configured as "Configured".
- [ ] Place one real order end-to-end (cash, then a small real Tap sandbox/live charge) and confirm the confirmation email actually arrives (not just logs to console).
- [ ] `curl -I https://your-domain.com/` shows the CSP, HSTS, and other security headers (see [security-checklist.md](./security-checklist.md)).
- [ ] `sitemap.xml` and `robots.txt` resolve and reference the real domain.
- [ ] Cloud Scheduler jobs show a successful first run (Console → Cloud Scheduler → job → "Last run result").

See [release-checklist.md](./release-checklist.md) for what to re-verify on
every subsequent deploy, not just the first one.
