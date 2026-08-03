# Troubleshooting guide

## "Emails aren't being delivered"

1. Check `/admin/integrations` — is "Transactional email (SMTP)" showing
   "Configured"? If not, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM`
   aren't all set, and the app is silently using `ConsoleEmailProvider`
   (logs only, never delivers) — see [environment-variables.md](./environment-variables.md).
2. If configured, check application logs for `"SMTP delivery failed"`
   entries (`infrastructure/email/smtp-email-provider.ts` logs the exact
   SMTP error) — most often an auth failure (wrong password), a port/TLS
   mismatch (`SMTP_SECURE` should be `true` for port 465, `false` for 587
   with STARTTLS), or the ESP rejecting the `SMTP_FROM` address (many
   providers require the from-address's domain to be verified).
3. Check the `emailOutbox` collection (Firestore console) for entries
   stuck at `status: "failed"` with `attempts` near
   `EMAIL_RETRY_MAX_ATTEMPTS` (5) — these have exhausted retries and won't
   be picked up again; fix the underlying issue, then manually reset the
   entry's `attempts` to 0 in the console if you want it retried, or
   trigger a new send by re-running the original action.
4. Confirm the retry worker is actually running on schedule — see
   [monitoring.md](./monitoring.md)'s job monitoring section.

## "The admin panel shows a permission error I don't expect"

- Every permission check is `requirePermission(actor, "namespace:action")`
  — the exact required permission is in the relevant `services/*` file's
  call. Check the actor's role(s) at `/admin/roles`.
- `super_admin` bypasses every check unconditionally (`isSuperAdmin` in
  `core/auth/permissions.ts`) — if a super admin is still denied
  something, that's a real bug, not a role-configuration issue.
- The admin nav (`AdminNav`) hides links a role can't use, but that's
  UX-only — a role technically without a nav link but with the permission
  granted directly can still navigate there by URL. Don't rely on "it's
  not in the nav" as proof of what a role can/can't do.

## "Checkout rejects a payment method I expect to be available"

- `/admin/site-settings` → "Payment providers" — confirm the specific
  method/fulfillment combination is actually enabled. Cash on delivery
  and cash on pickup are independent toggles even though they're the same
  `paymentMethod: "cash"` internally (`core/site-settings/entities.ts#isPaymentMethodEnabled`).
- If a `siteSettings` document exists from before this feature shipped
  (pre-upgrade), it's missing the `paymentProviders` field entirely —
  every read path treats that as "everything enabled" (see
  `services/site-settings/get-public-settings.ts`'s doc comment), so this
  shouldn't cause an unexpected rejection; if it does, the settings
  document may have been saved with the field explicitly set to disabled.

## "A scheduled job isn't running / keeps failing"

1. `gcloud scheduler jobs describe <job-name> --location=<region>` — check
   `status`/`lastAttemptTime`.
2. Test the route directly:
   ```bash
   curl -X POST https://your-domain.com/api/jobs/retry-failed-emails \
     -H "Authorization: Bearer $JOB_SECRET"
   ```
   A 401 means `JOB_SECRET` mismatch between what's deployed and what
   Cloud Scheduler is sending (`ops/setup-cloud-scheduler.sh`'s
   `--headers` flag) — re-run the provisioning script with the current
   value. Any other non-200 is an application error — check logs.
3. If the route times out: `--attempt-deadline=120s` in the provisioning
   script should be enough for the current batch limits
   (`EMAIL_RETRY_BATCH_LIMIT` = 50); a consistently slow response is worth
   investigating as a Firestore performance issue before raising the
   deadline further.

## "AI Admin Assistant always shows 'Store data snapshot' instead of a real answer"

This is the deterministic fallback (`RuleBasedAssistantProvider`), not a
bug — it runs automatically whenever `ANTHROPIC_API_KEY` isn't set, or
whenever a live call to Anthropic's API fails (timeout, bad response,
rate limit). Check `/admin/integrations` for whether the AI Assistant
shows "Configured"; if it does and you're still seeing the fallback, check
logs for `"Anthropic API request failed"` / `"AI Admin Assistant provider
failed, falling back..."` entries.

## "Build fails / typecheck fails after pulling changes"

```bash
pnpm install --frozen-lockfile   # never `pnpm install` alone in CI/deploy — see release-checklist.md
pnpm run build:shared            # the shared package must be built before typecheck/build can see its types
pnpm typecheck
pnpm build
```

If `pnpm typecheck`/`pnpm build` fail with errors pointing into
`@96order/shared`, the shared package's build output is stale or missing
— `pnpm run build:shared` first, always.

## "Firestore emulator tests fail locally but pass in CI (or vice versa)"

- Confirm `firebase-tools` is on the version pinned in the root
  `package.json` (`pnpm install` should already guarantee this).
- `pnpm test:integration`/`pnpm test:e2e:auth` both wrap the actual test
  command in `firebase emulators:exec` — if you run the inner command
  directly without that wrapper, there's no emulator running and every
  Admin SDK call will hang or fail to connect. Always use the `pnpm run`
  script, not a manually-assembled command.
- A stale `.next/cache` directory from a previous run can serve cached
  Data Cache entries against a *now-empty* fresh emulator (a new
  `emulators:exec` invocation always starts with empty Firestore/Auth
  data, no import/export configured) — `playwright.auth.config.ts`
  already does `rm -rf .next/cache` before every e2e run for exactly this
  reason; if you're invoking `next build`/`next start` manually outside
  that config, do the same.

## "CSP is blocking something in the browser console"

Check the exact directive in the console error (`Refused to load ... because it
violates the following Content Security Policy directive: "..."`).
`src/middleware.ts#buildContentSecurityPolicy` is the single source of
truth — if you've added a genuinely new first-party or third-party
resource (a new external script, font, or API the browser calls
directly), that directive needs the new host added there. Don't reach
for `'unsafe-inline'`/`'unsafe-eval'` in production as a quick fix — see
that file's doc comment for why the current policy is nonce-based instead.
