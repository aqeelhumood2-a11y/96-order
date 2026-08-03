# Operations documentation

Production launch/ops guides, separate from the root [README.md](../README.md)'s
phase-by-phase architecture and feature documentation.

| Guide | Covers |
|---|---|
| [deployment.md](./deployment.md) | Production deployment guide — Firebase/GCP setup, App Check, secrets, domain/SSL, Tap sandbox→live, scheduled jobs, post-deploy verification. |
| [environment-variables.md](./environment-variables.md) | Every environment variable: purpose, required vs. optional, safe fallback behavior. |
| [backup-and-disaster-recovery.md](./backup-and-disaster-recovery.md) | Backup strategy, restore procedure, disaster recovery plan. |
| [operations-and-maintenance.md](./operations-and-maintenance.md) | Routine admin tasks, common admin actions, scaling considerations. |
| [monitoring.md](./monitoring.md) | Health checks, uptime monitoring, logging, error monitoring, background job monitoring, alerting. |
| [troubleshooting.md](./troubleshooting.md) | Diagnosing common issues (email delivery, permissions, checkout, scheduled jobs, AI Assistant, builds, CSP). |
| [security-checklist.md](./security-checklist.md) | Security checklist with verified/pending status for every item. |
| [release-checklist.md](./release-checklist.md) | What to check before merging, deploying, and after every production release. |

`ops/setup-cloud-scheduler.sh` provisions the Cloud Scheduler jobs
referenced throughout these guides.
