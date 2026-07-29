import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Brand } from "@/core/catalog/entities";
import { NotFoundError } from "@/core/errors";
import type { BrandRepository } from "@/core/interfaces/brand-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";
import { diffUniqueKeyClaims, reconcileUniqueKeys, type UniqueKeyClaim } from "./catalog-unique-keys";

const COLLECTION = "brands";
const OWNER_KIND = "brand";

interface BrandDoc extends Omit<Brand, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Brand {
  const data = doc.data() as BrandDoc;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logoRef: data.logoRef,
    website: data.website,
    isActive: data.isActive,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
}

function slugClaim(slug: string): UniqueKeyClaim {
  return { type: "brand-slug", value: slug };
}

export class FirestoreBrandRepository implements BrandRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Brand | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const snap = await this.db().collection(COLLECTION).where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async list(request: PageRequest): Promise<Page<Brand>> {
    let query = this.db().collection(COLLECTION).orderBy("name", "asc").limit(request.limit);

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

  async create(brand: Brand): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(brand.id);
    await this.db().runTransaction(async (transaction) => {
      await reconcileUniqueKeys(this.db(), transaction, brand.id, OWNER_KIND, [slugClaim(brand.slug)]);
      const doc: BrandDoc = {
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logoRef: brand.logoRef,
        website: brand.website,
        isActive: brand.isActive,
        seoTitle: brand.seoTitle,
        seoDescription: brand.seoDescription,
        createdAt: Timestamp.fromDate(brand.createdAt),
        updatedAt: Timestamp.fromDate(brand.updatedAt),
        createdBy: brand.createdBy,
        updatedBy: brand.updatedBy,
      };
      transaction.set(ref, doc);
    });
  }

  async update(id: string, patch: Partial<Brand>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundError("Brand not found.");

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
      if (!snap.exists) throw new NotFoundError("Brand not found.");
      const current = toDomain(snap as QueryDocumentSnapshot);
      await reconcileUniqueKeys(this.db(), transaction, id, OWNER_KIND, [], [slugClaim(current.slug)]);
      transaction.delete(ref);
    });
  }
}
