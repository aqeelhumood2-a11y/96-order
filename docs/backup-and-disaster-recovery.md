# Backup, restore, and disaster recovery

## Backup strategy

### Firestore

Enable Firestore's built-in [scheduled backups](https://firebase.google.com/docs/firestore/backups)
against the production project:

```bash
gcloud firestore backups schedules create \
  --project=<your-production-project-id> \
  --database='(default)' \
  --recurrence=daily \
  --retention=30d
```

- Daily cadence, 30-day retention is a reasonable starting point for a
  single-store deployment; adjust `--retention` to match your compliance
  requirements.
- This is a point-in-time, whole-database backup — it captures every
  collection (`orders`, `payments`, `customers`, `emailOutbox`, etc.) as
  one consistent snapshot.
- List and verify scheduled backups exist:
  ```bash
  gcloud firestore backups schedules list --project=<your-production-project-id> --database='(default)'
  gcloud firestore backups list --project=<your-production-project-id>
  ```

### Storage (product images)

Enable [Object Versioning](https://cloud.google.com/storage/docs/object-versioning)
on the product-image bucket:

```bash
gcloud storage buckets update gs://<your-storage-bucket> --versioning
```

This gives point-in-time recovery of an accidentally overwritten or
deleted product image, independent of the Firestore backup above (product
images live in Storage, not Firestore — `infrastructure/firebase/product-image-storage.ts`).
Set a lifecycle rule to expire old versions after a reasonable window (e.g.
90 days) so this doesn't grow storage costs unbounded:

```bash
gcloud storage buckets update gs://<your-storage-bucket> \
  --lifecycle-file=- <<'EOF'
{"rule": [{"action": {"type": "Delete"}, "condition": {"isLive": false, "daysSinceNoncurrentTime": 90}}]}
EOF
```

### The audit log as a secondary source of truth

Every mutating action in this app already writes an append-only
`auditLogs`/`orderEvents` entry (Phase 2 onward — `AuditLogRepository`
exposes no update/delete method at all, which is what makes it genuinely
append-only, not just a convention). This isn't a substitute for the
backups above, but it means a corrupted or unexpectedly-changed document's
full history of changes is independently reconstructable even between
backup snapshots.

## Restore procedure

**Test this in a scratch project before you ever need it for real.** A
backup you've never restored from is not a verified backup.

1. Create (or reuse) a throwaway GCP project for the test restore.
2. Restore a Firestore backup into it:
   ```bash
   gcloud firestore databases restore \
     --project=<scratch-project-id> \
     --source-backup=<backup-name-from-`gcloud firestore backups list`> \
     --destination-database='(default)'
   ```
3. Point a local `.env.local` at the scratch project's config and run
   `pnpm dev` against it — verify the admin panel, orders, and catalog
   all look correct.
4. For a **real** incident (restoring into the actual production
   project): this overwrites the live database, so this is a last-resort
   action — restore into a scratch project first if there's any way to
   avoid touching production directly, and coordinate the cutover
   (maintenance-mode banner via `/admin/site-settings` — see
   `MaintenanceBanner` — is already built for exactly this kind of
   window).
5. Storage: object versioning (above) lets you restore a specific object
   version directly (`gcloud storage objects restore` or the console's
   version history UI) without a whole-bucket restore.

## Disaster recovery plan

| Scenario | Response |
|---|---|
| **App deployment is broken** (bad build, crashed service) | Roll back to the previous deployment via your hosting platform (Vercel: "Promote to Production" on the last-good deployment; Cloud Run: route traffic back to the previous revision with `gcloud run services update-traffic`). No Firestore/Storage action needed — app code and data are decoupled. |
| **Firestore data corruption/mass-deletion** (bug, compromised credential) | 1) Immediately rotate whatever credential caused it (Admin SDK service account key, or revoke the offending user's session). 2) Enable maintenance mode. 3) Follow the restore procedure above into a scratch project to confirm the right backup, then restore production. 4) Cross-check restored state against `auditLogs`/`orderEvents` for any legitimate writes that happened *after* the backup but before the incident, and manually reconcile if needed. |
| **Firebase project/region outage** | Out of this app's control — Firebase's own status page (`https://status.firebase.google.com`) is the source of truth. `GET /api/health` will correctly report `degraded` during this; your uptime monitor (see [monitoring.md](./monitoring.md)) should alert on it, not this app trying to fail over anywhere (no multi-region failover exists in this architecture — see Known limitations in the final report). |
| **Compromised admin account** | Immediately deactivate the account (`/admin/staff`), review `auditLogs` for what it touched, rotate `JOB_SECRET`/any secret it could have read, and force a password reset for every other admin as a precaution if the compromise vector is unclear. |
| **Lost `JOB_SECRET`/other secret** | Rotate it in your secret manager, update `ops/setup-cloud-scheduler.sh`'s job headers to match, redeploy. No data loss risk — these secrets gate *access*, they don't encrypt stored data. |

## What's not covered

- **Multi-region failover**: this app runs against a single Firestore
  database in a single region — a full regional Firebase outage means
  downtime, not automatic failover. Tracked as a backlog item for a
  future phase if uptime requirements demand it.
- **Automated backup-verification job**: no scheduled job restores a
  backup and checks it automatically — the restore procedure above is a
  manual runbook. Automating it is additive future work, not something
  this repository can meaningfully build without real GCP infrastructure
  to test against.
