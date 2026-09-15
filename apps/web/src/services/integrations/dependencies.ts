import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { PosIntegrationRepository } from "@/core/interfaces/pos-integration-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestorePosIntegrationRepository } from "@/infrastructure/firebase/repositories/firestore-pos-integration-repository";

export interface IntegrationsDeps {
  posIntegration: PosIntegrationRepository;
  auditLogs: AuditLogRepository;
}

export const defaultIntegrationsDeps: IntegrationsDeps = {
  posIntegration: new FirestorePosIntegrationRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
};
