#!/usr/bin/env bash
#
# Provisions the Cloud Scheduler jobs this app's background workers need in
# production. Run once per environment (or whenever a schedule/URL changes)
# against the real GCP project backing your Firebase project — this script
# does nothing on its own without that project existing; see the root
# README's Phase 8 section and docs/deployment.md for the surrounding
# checklist this is one step of.
#
# Every job hits a JOB_SECRET-protected route (see
# apps/web/src/lib/verify-job-secret.ts) — nothing here is public.
#
# Usage:
#   GCP_PROJECT=my-project \
#   APP_URL=https://shop.example.com \
#   JOB_SECRET=the-same-value-set-in-your-hosting-platform-env \
#   ./ops/setup-cloud-scheduler.sh
#
set -euo pipefail

: "${GCP_PROJECT:?Set GCP_PROJECT to your Firebase/GCP project id}"
: "${APP_URL:?Set APP_URL to the deployed app's origin, e.g. https://shop.example.com}"
: "${JOB_SECRET:?Set JOB_SECRET to the same value configured as the app's JOB_SECRET env var}"
LOCATION="${GCP_LOCATION:-us-central1}"

create_or_update_job() {
  local name="$1"
  local schedule="$2"
  local uri="$3"

  if gcloud scheduler jobs describe "$name" --project="$GCP_PROJECT" --location="$LOCATION" >/dev/null 2>&1; then
    echo "Updating $name..."
    gcloud scheduler jobs update http "$name" \
      --project="$GCP_PROJECT" --location="$LOCATION" \
      --schedule="$schedule" --uri="$uri" --http-method=POST \
      --headers="Authorization=Bearer ${JOB_SECRET}" \
      --attempt-deadline=120s
  else
    echo "Creating $name..."
    gcloud scheduler jobs create http "$name" \
      --project="$GCP_PROJECT" --location="$LOCATION" \
      --schedule="$schedule" --uri="$uri" --http-method=POST \
      --headers="Authorization=Bearer ${JOB_SECRET}" \
      --attempt-deadline=120s \
      --time-zone="UTC"
  fi
}

# Every 15 minutes: drain the transactional-email retry queue.
create_or_update_job "retry-failed-emails" "*/15 * * * *" "${APP_URL}/api/jobs/retry-failed-emails"

# Every 15 minutes: drain the back-in-stock notification retry queue.
create_or_update_job "retry-failed-notifications" "*/15 * * * *" "${APP_URL}/api/jobs/retry-failed-notifications"

# Every 10 minutes: proactively release expired inventory reservations
# (correctness doesn't depend on this — see services/inventory/expire-reservations.ts's
# doc comment — it only reclaims capacity sooner).
create_or_update_job "expire-reservations" "*/10 * * * *" "${APP_URL}/api/jobs/expire-reservations"

echo "Done. List jobs with: gcloud scheduler jobs list --project=${GCP_PROJECT} --location=${LOCATION}"
