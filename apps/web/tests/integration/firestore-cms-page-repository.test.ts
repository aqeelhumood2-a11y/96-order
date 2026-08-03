import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/errors";
import type { CmsPage } from "@/core/cms/entities";
import { FirestoreCmsPageRepository } from "@/infrastructure/firebase/repositories/firestore-cms-page-repository";

const repo = new FirestoreCmsPageRepository();

function makePage(overrides: Partial<CmsPage> = {}): CmsPage {
  const now = new Date();
  return {
    id: randomUUID(),
    title: "About Us",
    slug: `about-${randomUUID().slice(0, 8)}`,
    content: "We roast coffee.",
    status: "draft",
    showInNav: false,
    showInFooter: true,
    sortOrder: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "admin-1",
    updatedBy: "admin-1",
    ...overrides,
  };
}

describe("FirestoreCmsPageRepository (emulator)", () => {
  it("create() then findById()/findBySlug() round-trip the page", async () => {
    const page = makePage();
    await repo.create(page);

    expect(await repo.findById(page.id)).toEqual(page);
    expect(await repo.findBySlug(page.slug)).toEqual(page);
  });

  it("create() rejects a second page reusing an already-claimed slug", async () => {
    const slug = `dup-${randomUUID().slice(0, 8)}`;
    await repo.create(makePage({ slug }));

    await expect(repo.create(makePage({ slug }))).rejects.toThrow(ConflictError);
  });

  it("findPublishedBySlug() only ever returns a published page", async () => {
    const draft = makePage({ status: "draft" });
    await repo.create(draft);
    expect(await repo.findPublishedBySlug(draft.slug)).toBeNull();

    await repo.update(draft.id, { status: "published" }, draft.version);
    const published = await repo.findPublishedBySlug(draft.slug);
    expect(published?.status).toBe("published");
  });

  it("update() bumps the version and throws ConflictError on a stale expectedVersion", async () => {
    const page = makePage();
    await repo.create(page);

    await repo.update(page.id, { title: "New Title" }, page.version);
    const updated = await repo.findById(page.id);
    expect(updated?.title).toBe("New Title");
    expect(updated?.version).toBe(page.version + 1);

    await expect(repo.update(page.id, { title: "Stale Edit" }, page.version)).rejects.toThrow(ConflictError);
  });

  it("update() rejects renaming to a slug already used by a different page", async () => {
    const pageA = makePage();
    const pageB = makePage();
    await repo.create(pageA);
    await repo.create(pageB);

    await expect(repo.update(pageB.id, { slug: pageA.slug }, pageB.version)).rejects.toThrow(ConflictError);
  });

  it("update() throws NotFoundError for a page that doesn't exist", async () => {
    await expect(repo.update(randomUUID(), { title: "x" }, 1)).rejects.toThrow(NotFoundError);
  });

  it("listPublishedVisible() only returns published pages, ordered by sortOrder", async () => {
    const marker = randomUUID().slice(0, 8);
    const first = makePage({ status: "published", sortOrder: 1, title: `Z-${marker}` });
    const second = makePage({ status: "published", sortOrder: 2, title: `Y-${marker}` });
    const draft = makePage({ status: "draft", title: `X-${marker}` });
    await repo.create(first);
    await repo.create(second);
    await repo.create(draft);

    const pages = await repo.listPublishedVisible();
    const titles = pages.filter((page) => page.title.endsWith(marker)).map((page) => page.title);
    expect(titles).toEqual([`Z-${marker}`, `Y-${marker}`]);
  });

  it("delete() removes the page", async () => {
    const page = makePage();
    await repo.create(page);
    await repo.delete(page.id);

    expect(await repo.findById(page.id)).toBeNull();
  });
});
