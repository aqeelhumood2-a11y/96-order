# Release checklist

Run this for every deploy to production, not just the first one.

## Before merging

- [ ] `pnpm install --frozen-lockfile` — never a plain `pnpm install` in
      CI/deploy; a frozen install fails loudly if the lockfile is out of
      sync instead of silently resolving different versions than what was
      tested.
- [ ] `pnpm lint` — zero errors (warnings are tracked but non-blocking;
      check `git log`/PR description if a new warning appeared, to decide
      if it's expected).
- [ ] `pnpm typecheck`
- [ ] `pnpm test` — all unit tests pass.
- [ ] `pnpm test:integration` — all Firestore/Auth-emulator integration
      tests pass.
- [ ] `pnpm build` — production build succeeds with no new warnings you
      don't understand.
- [ ] `pnpm test:e2e` and `pnpm test:e2e:auth` — all e2e tests pass.
- [ ] `pnpm audit --prod` — no new findings beyond what's already
      documented/accepted in [security-checklist.md](./security-checklist.md);
      investigate and either fix or document any new one before merging.
- [ ] If `firestore.rules`/`storage.rules`/`firestore.indexes.json`
      changed: reviewed line-by-line, not just "tests pass" — these
      files are the primary defense-in-depth layer (see
      [security-checklist.md](./security-checklist.md)).
- [ ] If any new environment variable was introduced: added to
      `apps/web/.env.example` and [environment-variables.md](./environment-variables.md).

## Deploying

- [ ] Confirm which environment you're deploying to (staging vs.
      production) before running any deploy command — especially before
      any Firestore rules/indexes deploy, which take effect immediately
      with no confirmation prompt.
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,storage`
      if those files changed, **before** deploying app code that depends
      on a new collection/index (an app deploy that queries a not-yet-indexed
      field will error in production until the index deploy catches up).
- [ ] Deploy the app build via your hosting platform's normal flow.
- [ ] If new Cloud Scheduler jobs were added or a job's route changed: re-run
      `ops/setup-cloud-scheduler.sh`.

## After deploying

- [ ] `curl https://your-domain.com/api/health` → `200`, `{"status":"ok"}`.
- [ ] Spot-check the homepage and one product page load correctly with no
      console errors (the app's own e2e suite already asserts this in
      CI — this is a live, post-deploy sanity check, not a repeat of that
      testing).
- [ ] `curl -I https://your-domain.com/` shows the expected security
      headers (`content-security-policy`, `strict-transport-security`,
      `x-frame-options`, etc.).
- [ ] Log in to `/admin` with a real (non-super-admin, if you have one)
      staff account and confirm the dashboard loads.
- [ ] If this release touched checkout/payments: place one real test
      order (cash) and confirm it appears correctly in `/admin/orders`.
- [ ] Watch application logs for the first several minutes after deploy
      for any new `level="error"` entries.
- [ ] If this release touched email templates or the SMTP provider:
      trigger one real send (e.g. a test order) and confirm delivery, not
      just that the outbox entry shows `"sent"` (a false-positive "sent"
      from a misconfigured but non-erroring SMTP relay is possible).

## Rollback

If a release causes a production issue:

1. Roll back the app deployment first (fastest, no data risk — see
   [backup-and-disaster-recovery.md](./backup-and-disaster-recovery.md)'s
   disaster-recovery table).
2. Only roll back `firestore.rules`/`firestore.indexes.json` if the
   *rules themselves* are the problem (rare) — rolling back indexes can
   briefly break queries that the rolled-back app version doesn't issue
   but the *previous* app version does, if schemas diverged. Think
   through the interaction before doing this, don't reflexively revert
   everything.
3. File/track the root cause before the next release — don't let a
   rollback silently become "the fix."

## Cadence

- **Every merge to the release branch**: the "Before merging" section
  above, enforced by CI.
- **Every production deploy**: the full checklist.
- **Monthly**: [operations-and-maintenance.md](./operations-and-maintenance.md)'s
  routine maintenance tasks, independent of any specific release.
