import type { Session } from "@/core/auth/entities";
import type { Page } from "@/core/interfaces/repository";
import type { AuditLogEntry } from "@/core/auth/entities";
import type { ListAuditLogsRequest } from "@/core/interfaces/audit-log-repository";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export async function listAuditLogs(
  actor: Session,
  request: ListAuditLogsRequest,
  deps: AuthDeps = defaultAuthDeps,
): Promise<Page<AuditLogEntry>> {
  requirePermission(actor, "audit_logs:view");
  return deps.auditLogs.list(request);
}
