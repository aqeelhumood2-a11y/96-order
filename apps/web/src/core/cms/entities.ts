export const CMS_PAGE_STATUSES = ["draft", "published"] as const;
export type CmsPageStatus = (typeof CMS_PAGE_STATUSES)[number];

/** Optimistic concurrency (`version`/`expectedVersion`) — same pattern as `core/catalog/entities.ts#Product`, so two admins editing the same page can't silently clobber each other. */
export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  status: CmsPageStatus;
  showInNav: boolean;
  showInFooter: boolean;
  sortOrder: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
