import { randomUUID } from "node:crypto";
import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import type { CmsPage } from "@/core/cms/entities";
import { cmsPageInputSchema, type CmsPageInput } from "@/core/cms/schemas";
import { NotFoundError, ValidationError } from "@/core/errors";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultCmsDeps, type CmsDeps } from "./dependencies";

export async function listCmsPages(actor: Session, request: PageRequest, deps: CmsDeps = defaultCmsDeps): Promise<Page<CmsPage>> {
  requirePermission(actor, "cms:view");
  return deps.pages.list(request);
}

export async function getCmsPage(actor: Session, id: string, deps: CmsDeps = defaultCmsDeps): Promise<CmsPage> {
  requirePermission(actor, "cms:view");
  const page = await deps.pages.findById(id);
  if (!page) throw new NotFoundError("Page not found.");
  return page;
}

export async function createCmsPage(actor: Session, input: CmsPageInput, deps: CmsDeps = defaultCmsDeps): Promise<CmsPage> {
  requirePermission(actor, "cms:create");
  const parsed = cmsPageInputSchema.parse(input);
  const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  if (!slug) throw new ValidationError("Could not derive a URL slug from the title.");

  const now = new Date();
  const page: CmsPage = {
    id: randomUUID(),
    title: parsed.title,
    slug,
    content: parsed.content,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    status: parsed.status,
    showInNav: parsed.showInNav,
    showInFooter: parsed.showInFooter,
    sortOrder: parsed.sortOrder,
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  };
  await deps.pages.create(page);
  await deps.auditLogs.record({ type: "cms_page_created", actorUid: actor.uid, actorEmail: actor.email, metadata: { pageId: page.id, slug } });
  if (page.status === "published") {
    await deps.auditLogs.record({ type: "cms_page_published", actorUid: actor.uid, actorEmail: actor.email, metadata: { pageId: page.id, slug } });
  }
  return page;
}

export async function updateCmsPage(actor: Session, id: string, input: CmsPageInput, deps: CmsDeps = defaultCmsDeps): Promise<void> {
  requirePermission(actor, "cms:edit");
  const existing = await deps.pages.findById(id);
  if (!existing) throw new NotFoundError("Page not found.");
  if (input.expectedVersion === undefined) {
    throw new ValidationError("Missing the page version being edited.");
  }

  const parsed = cmsPageInputSchema.parse(input);
  const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.title);
  if (!slug) throw new ValidationError("Could not derive a URL slug from the title.");

  const wasPublished = existing.status === "published";
  await deps.pages.update(
    id,
    {
      title: parsed.title,
      slug,
      content: parsed.content,
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
      status: parsed.status,
      showInNav: parsed.showInNav,
      showInFooter: parsed.showInFooter,
      sortOrder: parsed.sortOrder,
      updatedBy: actor.uid,
    },
    input.expectedVersion,
  );

  await deps.auditLogs.record({ type: "cms_page_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: { pageId: id, slug } });
  if (!wasPublished && parsed.status === "published") {
    await deps.auditLogs.record({ type: "cms_page_published", actorUid: actor.uid, actorEmail: actor.email, metadata: { pageId: id, slug } });
  }
}

export async function deleteCmsPage(actor: Session, id: string, deps: CmsDeps = defaultCmsDeps): Promise<void> {
  requirePermission(actor, "cms:delete");
  const existing = await deps.pages.findById(id);
  if (!existing) throw new NotFoundError("Page not found.");
  await deps.pages.delete(id);
  await deps.auditLogs.record({ type: "cms_page_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: { pageId: id, slug: existing.slug, deleted: true } });
}
