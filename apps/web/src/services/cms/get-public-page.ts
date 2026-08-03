import type { CmsPage } from "@/core/cms/entities";
import { defaultCmsDeps, type CmsDeps } from "./dependencies";

/** Public — published pages only, ever. */
export async function getPublicCmsPage(slug: string, deps: CmsDeps = defaultCmsDeps): Promise<CmsPage | null> {
  return deps.pages.findPublishedBySlug(slug);
}

/** Bounded, admin-curated list — powers the header/footer's CMS-page links (`showInNav`/`showInFooter`). */
export async function listNavFooterPages(deps: CmsDeps = defaultCmsDeps): Promise<{ navPages: CmsPage[]; footerPages: CmsPage[] }> {
  const pages = await deps.pages.listPublishedVisible();
  return { navPages: pages.filter((page) => page.showInNav), footerPages: pages.filter((page) => page.showInFooter) };
}
