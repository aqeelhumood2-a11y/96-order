import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { PublicCategory, PublicCategoryRef } from "@/core/storefront/dto";
import type { PublicCategoryRepository } from "@/core/interfaces/public-category-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "categories";

interface CategoryDoc {
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

/** Every query here filters `isActive == true` — an inactive category can never be returned, including by direct id/slug lookup. */
export class FirestorePublicCategoryRepository implements PublicCategoryRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  private async toPublic(doc: QueryDocumentSnapshot): Promise<PublicCategory> {
    const data = doc.data() as CategoryDoc;
    let parent: PublicCategoryRef | null = null;

    if (data.parentId) {
      const parentSnap = await this.db().collection(COLLECTION).doc(data.parentId).get();
      const parentData = parentSnap.data() as CategoryDoc | undefined;
      if (parentSnap.exists && parentData?.isActive) {
        parent = { name: parentData.name, slug: parentData.slug };
      }
    }

    return {
      id: doc.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      parent,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
    };
  }

  async findBySlug(slug: string): Promise<PublicCategory | null> {
    const snap = await this.db().collection(COLLECTION).where("slug", "==", slug).where("isActive", "==", true).limit(1).get();
    return snap.empty ? null : this.toPublic(snap.docs[0]!);
  }

  async findById(id: string): Promise<PublicCategory | null> {
    const doc = await this.db().collection(COLLECTION).doc(id).get();
    if (!doc.exists || !(doc.data() as CategoryDoc).isActive) return null;
    return this.toPublic(doc as QueryDocumentSnapshot);
  }

  async listActive(limit = 50): Promise<PublicCategory[]> {
    const snap = await this.db().collection(COLLECTION).where("isActive", "==", true).orderBy("sortOrder", "asc").limit(limit).get();
    return Promise.all(snap.docs.map((doc) => this.toPublic(doc)));
  }
}
