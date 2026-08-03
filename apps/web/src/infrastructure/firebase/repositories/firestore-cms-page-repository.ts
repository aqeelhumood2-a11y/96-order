import "server-only";
import { randomUUID } from "node:crypto";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { ConflictError, NotFoundError } from "@/core/errors";
import type { CmsPage } from "@/core/cms/entities";
import type { CmsPageRepository } from "@/core/interfaces/cms-page-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "cmsPages";

interface CmsPageDoc extends Omit<CmsPage, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): CmsPage {
  const data = doc.data() as CmsPageDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate(), updatedAt: data.updatedAt.toDate() };
}

function toDoc(page: CmsPage): CmsPageDoc {
  return {
    title: page.title,
    slug: page.slug,
    content: page.content,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    status: page.status,
    showInNav: page.showInNav,
    showInFooter: page.showInFooter,
    sortOrder: page.sortOrder,
    version: page.version,
    createdAt: Timestamp.fromDate(page.createdAt),
    updatedAt: Timestamp.fromDate(page.updatedAt),
    createdBy: page.createdBy,
    updatedBy: page.updatedBy,
  };
}

export class FirestoreCmsPageRepository implements CmsPageRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<CmsPage | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findBySlug(slug: string): Promise<CmsPage | null> {
    const snap = await this.db().collection(COLLECTION).where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0] as QueryDocumentSnapshot);
  }

  async findPublishedBySlug(slug: string): Promise<CmsPage | null> {
    const snap = await this.db().collection(COLLECTION).where("slug", "==", slug).where("status", "==", "published").limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0] as QueryDocumentSnapshot);
  }

  async list(request: PageRequest): Promise<Page<CmsPage>> {
    let query = this.db().collection(COLLECTION).orderBy("sortOrder", "asc").limit(request.limit);
    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async listPublishedVisible(): Promise<CmsPage[]> {
    const snap = await this.db().collection(COLLECTION).where("status", "==", "published").orderBy("sortOrder", "asc").get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async create(page: CmsPage): Promise<void> {
    const existing = await this.findBySlug(page.slug);
    if (existing) throw new ConflictError("A page with this slug already exists.");
    await this.db()
      .collection(COLLECTION)
      .doc(page.id || randomUUID())
      .set(toDoc(page));
  }

  async update(id: string, patch: Partial<CmsPage>, expectedVersion: number): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundError("Page not found.");

      const current = toDomain(snap as QueryDocumentSnapshot);
      if (current.version !== expectedVersion) {
        throw new ConflictError("This page was changed by someone else. Reload and try again.");
      }

      if (patch.slug && patch.slug !== current.slug) {
        const collision = await transaction.get(this.db().collection(COLLECTION).where("slug", "==", patch.slug).limit(1));
        if (!collision.empty) {
          throw new ConflictError("A page with this slug already exists.");
        }
      }

      const next: CmsPage = { ...current, ...patch, version: current.version + 1, updatedAt: new Date() };
      transaction.set(ref, toDoc(next));
    });
  }

  async delete(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).delete();
  }
}
