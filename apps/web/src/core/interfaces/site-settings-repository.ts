import type { SiteSettings } from "@/core/site-settings/entities";

/** A singleton — `get()` returns the one stored settings doc, or `null` if never saved (callers fall back to `defaultSiteSettings()`). No `expectedVersion` guard: unlike `CmsPage`, this is edited by at most one admin at a time in practice on one dedicated screen, so plain last-write-wins is an accepted, documented simplification. */
export interface SiteSettingsRepository {
  get(): Promise<SiteSettings | null>;
  set(settings: SiteSettings): Promise<void>;
}
