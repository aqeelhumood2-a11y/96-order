# Monitoring guide

## Health checks

`GET /api/health` — unauthenticated by design (this is what a load
balancer or uptime monitor hits), checks Firestore reachability with a
5-second-bounded read, and returns only pass/fail booleans, never error
detail:

```json
{ "status": "ok", "timestamp": "...", "checks": { "firestore": "ok" } }
```

HTTP 200 when healthy, 503 when not. Point your hosting platform's health
check and an external uptime monitor (see below) at this endpoint.

## Uptime monitoring

Any external uptime service works against `GET /api/health` — e.g. Google
Cloud Monitoring's Uptime Checks (free tier, integrates directly with
Cloud Monitoring alerting if you're already on GCP):

```bash
gcloud monitoring uptime create "96-order-health" \
  --project=<your-production-project-id> \
  --resource-type=uptime-url \
  --host=<your-domain> \
  --path=/api/health \
  --period=5
```

Alternatives: UptimeRobot, Better Uptime, Pingdom — any HTTP checker that
polls `/api/health` every 1-5 minutes and alerts on non-200 or timeout is
sufficient.

## Application logging

Every server-side log line is structured JSON via `lib/logger.ts`
(`{level, message, timestamp, ...fields}`), written to stdout/stderr —
Cloud Run/App Hosting/Vercel all pick this up automatically into their
respective log viewers (Cloud Logging, Vercel's log drain) with zero
extra configuration. Query examples (Cloud Logging):

```
resource.type="cloud_run_revision"
jsonPayload.level="error"
```

## Error monitoring

`apps/web/src/instrumentation.ts` registers Next.js's `onRequestError`
hook — every uncaught error in a Server Component, Route Handler, or
Server Action logs through the same structured `logger.error` path
described above, in addition to whatever that code path already does with
the error. This is meaningful monitoring on its own (searchable,
alertable structured logs), and is also the one centralized place a
third-party error-monitoring SDK (Sentry, Cloud Error Reporting) would be
added later — see the root README's Backlog.

To alert on a spike in errors today without adding a new dependency, use a
Cloud Logging-based alert policy:

```bash
gcloud logging metrics create server-errors \
  --project=<your-production-project-id> \
  --description="Unhandled server errors" \
  --log-filter='resource.type="cloud_run_revision" AND jsonPayload.level="error" AND jsonPayload.message="Unhandled server error"'
```

then create a Cloud Monitoring alert policy on that log-based metric
(Console → Monitoring → Alerting → create policy → select the
`server-errors` metric → set a threshold, e.g. >5 in 5 minutes).

## Background job monitoring

Three Cloud Scheduler jobs (provisioned by `ops/setup-cloud-scheduler.sh`)
call `JOB_SECRET`-protected routes on a schedule:

| Job | Route | Cadence | What it does |
|---|---|---|---|
| `retry-failed-emails` | `POST /api/jobs/retry-failed-emails` | every 15 min | Drains `emailOutbox`'s still-`"failed"` entries (`services/email/retry-failed-emails.ts`). |
| `retry-failed-notifications` | `POST /api/jobs/retry-failed-notifications` | every 15 min | Same, for back-in-stock `notificationOutbox` entries (`services/back-in-stock/retry-failed-notifications.ts`). |
| `expire-reservations` | `POST /api/jobs/expire-reservations` | every 10 min | Proactively releases expired inventory reservations (`services/inventory/expire-reservations.ts`) — correctness doesn't depend on this running (see that file's doc comment), it only reclaims capacity sooner. |

Each returns a JSON body with counts (`{ok: true, attempted, succeeded,
stillFailing}` for the two retry workers, `{ok: true, releasedCount}` for
the sweep) — Cloud Scheduler's own job history (Console → Cloud Scheduler
→ job) shows the HTTP status of each run; a run of `retry-failed-emails`
with a consistently nonzero `stillFailing` count over several runs is a
sign your SMTP provider itself is degraded, worth alerting on separately
from the job's own HTTP success.

An admin can also manually trigger the two retry workers (not the
reservation sweep) from `/admin/integrations` without waiting for the next
scheduled run — useful when diagnosing a delivery issue live.

## Analytics / reporting

`/admin/reports` is the store-operations analytics surface: sales over
time, best-selling products, orders by status, cash payments (pending vs.
confirmed, delivery vs. pickup), online (Tap) payments by status, and a
live pending-cash-collection worklist. This is operational reporting, not
visitor/behavior analytics (GA4/PostHog) — see the root README's Backlog
if you need the latter.

## Alerts checklist

- [ ] Uptime monitor on `GET /api/health`, alerting on non-200/timeout.
- [ ] Cloud Logging-based alert (or third-party sink) on `level="error"` log spikes.
- [ ] Cloud Scheduler job-failure notifications enabled (Console → Cloud Scheduler → job → notification settings, or a Cloud Monitoring alert on the job's own execution-count/failure metrics).
- [ ] A recurring (weekly is reasonable) manual glance at `/admin/reports`' pending-cash-collection section — cash orders sitting unconfirmed for a long time are a business problem this app surfaces but doesn't page anyone about.
