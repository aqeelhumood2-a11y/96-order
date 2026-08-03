import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { SiteSettingsRepository } from "@/core/interfaces/site-settings-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreSiteSettingsRepository } from "@/infrastructure/firebase/repositories/firestore-site-settings-repository";

export interface SiteSettingsDeps {
  settings: SiteSettingsRepository;
  auditLogs: AuditLogRepository;
}

export const defaultSiteSettingsDeps: SiteSettingsDeps = {
  settings: new FirestoreSiteSettingsRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
};
