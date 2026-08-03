import type { CmsPage } from "@/core/cms/entities";
import type { Page, PageRequest } from "./repository";

export interface CmsPageRepository {
  findById(id: string): Promise<CmsPage | null>;
  findBySlug(slug: string): Promise<CmsPage | null>;
  /** `status == "published"` only — the public `/pages/[slug]` route's only read path. */
  findPublishedBySlug(slug: string): Promise<CmsPage | null>;
  /** `/admin/cms/pages` — every status. */
  list(request: PageRequest): Promise<Page<CmsPage>>;
  /** Bounded (admin-curated, expected to stay small) — powers the nav/footer's CMS-page links. */
  listPublishedVisible(): Promise<CmsPage[]>;
  create(page: CmsPage): Promise<void>;
  /** Throws `ConflictError` if `patch.version` doesn't match the stored `version` — see `CmsPage.version`'s doc comment. */
  update(id: string, patch: Partial<CmsPage>, expectedVersion: number): Promise<void>;
  delete(id: string): Promise<void>;
}
