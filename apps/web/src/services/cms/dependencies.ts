import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CmsPageRepository } from "@/core/interfaces/cms-page-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCmsPageRepository } from "@/infrastructure/firebase/repositories/firestore-cms-page-repository";

export interface CmsDeps {
  pages: CmsPageRepository;
  auditLogs: AuditLogRepository;
}

export const defaultCmsDeps: CmsDeps = {
  pages: new FirestoreCmsPageRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
};
