# Operations & maintenance manual

## Routine tasks

| Task | Frequency | How |
|---|---|---|
| Review the pending-cash-collection worklist | Daily (cash-heavy stores) / weekly | `/admin/reports` → "Pending cash collection" — confirm cash and release/cancel stale orders as needed. |
| Review failed email/notification queues | Weekly, or on a delivery-issue report | `/admin/integrations` shows manual retry buttons; if `stillFailing` stays nonzero across several scheduled runs (see [monitoring.md](./monitoring.md)), the SMTP provider itself likely needs attention, not just a retry. |
| Review staff/role list for stale accounts | Monthly | `/admin/staff` — deactivate accounts for departed staff; `/admin/roles` to audit what each role can do. |
| Review `auditLogs` for unexpected activity | Monthly, or on suspicion of an issue | No dedicated admin UI queries `auditLogs` directly yet — inspect via the Firestore console (`auditLogs` collection, filtered by `type`/`actorEmail`/`createdAt`) since it's Admin-SDK-only by design (see the root README's Security baseline). |
| Rotate `JOB_SECRET` | Quarterly, or immediately on suspected leak | Update in your secret manager, then re-run `ops/setup-cloud-scheduler.sh` with the new value so the scheduled jobs' `Authorization` header matches. |
| Rotate `TAP_SECRET_KEY` | Per Tap's own guidance, or on suspected leak | Update in your secret manager and redeploy — no code change needed. |
| Dependency updates | Monthly | `pnpm outdated`, then `pnpm audit` (see [security-checklist.md](./security-checklist.md)) — bump patch/minor versions routinely; treat major version bumps (Next.js, Firebase Admin SDK, Tailwind) as their own reviewed change, not a routine maintenance action. |
| Firestore backup verification | Quarterly | Follow the restore procedure in [backup-and-disaster-recovery.md](./backup-and-disaster-recovery.md) against a scratch project. |

## Common admin actions

- **Confirm a cash payment**: order detail page (`/admin/orders/[orderId]`) → "Confirm cash payment" button — this is the only action that converts a cash order's *reserved* inventory into a permanent deduction.
- **Cancel an order**: same page → "Cancel order" (prompts for an optional reason, recorded to `orderEvents`).
- **Release a reservation without cancelling the order**: same page → "Release reservation" — for when a customer asks to drop one item without cancelling the whole order.
- **Enable/disable a payment provider**: `/admin/site-settings` → "Payment providers" — takes effect immediately, both server-side (checkout rejects a disabled method) and client-side (the checkout form hides it).
- **Toggle maintenance mode**: `/admin/site-settings` → "Maintenance mode" — shows a site-wide banner (`MaintenanceBanner`); doesn't block traffic, purely informational (no maintenance-mode gate exists on routes themselves).
- **Trigger the email/notification retry workers manually**: `/admin/integrations`.

## Scaling considerations

- **Bounded report scans**: `services/reports/*`, `services/reports/payments-report.ts`,
  and `/api/integrations/orders/sync` all cap how many documents a single
  call reads (`REPORT_SCAN_LIMIT`, `ORDER_SYNC_MAX_RESULTS`). At high order
  volume, a report over a wide date range can silently under-report once
  it hits the cap — see the root README's Known limitations for each
  area's exact bound. Narrowing the date range is today's workaround;
  raising the limit or switching to a real aggregation query is future
  work.
- **Job batch limits**: `EMAIL_RETRY_BATCH_LIMIT` (50 per run) bounds how
  many failed emails one scheduled run drains — a large backlog drains
  over several runs (every 15 minutes), not instantly. This is
  intentional (keeps each run fast and its Firestore read cost
  predictable), not a bug.
- **Single-region Firestore**: see [backup-and-disaster-recovery.md](./backup-and-disaster-recovery.md)'s
  "What's not covered" section.

## Firestore cost/read-write hygiene

- Storefront reads are cached via `unstable_cache` (`services/storefront/cache.ts`)
  and invalidated by tag on the relevant admin write — most storefront
  page loads don't hit Firestore at all once warm.
- The AI Admin Assistant's context assembly (`services/ai-assistant/ask-assistant.ts`)
  does one bounded 30-day order scan per question, gated by
  `AI_ASSISTANT_RATE_LIMIT` (20 questions/15 min per admin) specifically
  because it's a real per-call cost (both the Firestore reads and,
  when configured, the Anthropic API call) — don't raise that limit
  without considering both costs.
