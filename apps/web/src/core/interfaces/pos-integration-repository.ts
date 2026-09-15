import type { PosIntegrationSettings } from "@/core/integrations/entities";

/** Single-document store, same shape as `SiteSettingsRepository` — see `core/integrations/entities.ts`'s doc comment for why this is a separate document rather than a `SiteSettings` field. */
export interface PosIntegrationRepository {
  get(): Promise<PosIntegrationSettings | null>;
  set(settings: PosIntegrationSettings): Promise<void>;
}
