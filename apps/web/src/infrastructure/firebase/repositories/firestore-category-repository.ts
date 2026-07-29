import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Category } from "@/core/catalog/entities";
import { NotFoundError } from "@/core/errors";
import type { CategoryRepository, ListCategoriesRequest } from "@/core/interfaces/category-repository";
import type { Page } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";
import { diffUniqueKeyClaims, reconcileUniqueKeys, type UniqueKeyClaim } from "./catalog-unique-keys";

const COLLECTION = "categories";
const OWNER_KIND = "category";

interface CategoryDoc extends Omit<Category, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Category {
  const data = doc.data() as CategoryDoc;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    parentId: data.parentId,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    imageRef: data.imageRef,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
}

function slugClaim(slug: string): UniqueKeyClaim {
  return { type: "category-slug", value: slug };
}

export class FirestoreCategoryRepository implements CategoryRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Category | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const snap = await this.db().collection(COLLECTION).where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async list(request: ListCategoriesRequest): Promise<Page<Category>> {
    let query = this.db().collection(COLLECTION).orderBy("sortOrder", "asc").limit(request.limit);

    if (request.parentId !== undefined) {
      query = this.db()
        .collection(COLLECTION)
        .where("parentId", "==", request.parentId)
        .orderBy("sortOrder", "asc")
        .limit(request.limit);
    }

    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const items = snap.docs.map(toDomain);
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async listAll(): Promise<Category[]> {
    const snap = await this.db().collection(COLLECTION).orderBy("sortOrder", "asc").get();
    return snap.docs.map(toDomain);
  }

  async create(category: Category): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(category.id);
    await this.db().runTransaction(async (transaction) => {
      await reconcileUniqueKeys(this.db(), transaction, category.id, OWNER_KIND, [slugClaim(category.slug)]);
      const doc: CategoryDoc = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        imageRef: category.imageRef,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
        createdAt: Timestamp.fromDate(category.createdAt),
        updatedAt: Timestamp.fromDate(category.updatedAt),
        createdBy: category.createdBy,
        updatedBy: category.updatedBy,
      };
      transaction.set(ref, doc);
    });
  }

  async update(id: string, patch: Partial<Category>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundError("Category not found.");

      if (patch.slug !== undefined) {
        const current = toDomain(snap as QueryDocumentSnapshot);
        const { toClaim, toRelease } = diffUniqueKeyClaims([slugClaim(current.slug)], [slugClaim(patch.slug)]);
        await reconcileUniqueKeys(this.db(), transaction, id, OWNER_KIND, toClaim, toRelease);
      }

      transaction.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
    });
  }

  async delete(id: string): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundError("Category not found.");
      const current = toDomain(snap as QueryDocumentSnapshot);
      await reconcileUniqueKeys(this.db(), transaction, id, OWNER_KIND, [], [slugClaim(current.slug)]);
      transaction.delete(ref);
    });
  }
}
