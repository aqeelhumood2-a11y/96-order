import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { PublicBrand } from "@/core/storefront/dto";
import type { PublicBrandRepository } from "@/core/interfaces/public-brand-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "brands";

interface BrandDoc {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

function toPublic(doc: QueryDocumentSnapshot): PublicBrand {
  const data = doc.data() as BrandDoc;
  return {
    id: doc.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    website: data.website,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
  };
}

/** Every query here filters `isActive == true` — an inactive brand can never be returned, including by direct id/slug lookup. */
export class FirestorePublicBrandRepository implements PublicBrandRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findBySlug(slug: string): Promise<PublicBrand | null> {
    const snap = await this.db().collection(COLLECTION).where("slug", "==", slug).where("isActive", "==", true).limit(1).get();
    return snap.empty ? null : toPublic(snap.docs[0]!);
  }

  async findById(id: string): Promise<PublicBrand | null> {
    const doc = await this.db().collection(COLLECTION).doc(id).get();
    if (!doc.exists || !(doc.data() as BrandDoc).isActive) return null;
    return toPublic(doc as QueryDocumentSnapshot);
  }

  async listActive(limit = 50): Promise<PublicBrand[]> {
    const snap = await this.db().collection(COLLECTION).where("isActive", "==", true).orderBy("name", "asc").limit(limit).get();
    return snap.docs.map(toPublic);
  }
}
