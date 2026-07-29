import type { AuditLogEntry, AuditLogEventType, NewAuditLogEntry } from "@/core/auth/entities";
import type { Page, PageRequest } from "./repository";

export interface ListAuditLogsRequest extends PageRequest {
  type?: AuditLogEventType;
}

/**
 * Port for the append-only `auditLogs` collection. Deliberately exposes no
 * update or delete method anywhere in this interface — that omission *is*
 * the append-only enforcement, since Firestore Security Rules don't apply
 * to Admin SDK writes and can't be relied on for this invariant.
 */
export interface AuditLogRepository {
  record(entry: NewAuditLogEntry): Promise<AuditLogEntry>;
  list(request: ListAuditLogsRequest): Promise<Page<AuditLogEntry>>;
}
