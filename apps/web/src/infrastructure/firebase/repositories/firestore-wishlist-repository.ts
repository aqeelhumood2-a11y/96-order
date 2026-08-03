import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { wishlistItemId, type WishlistItem } from "@/core/wishlist/entities";
import type { WishlistRepository } from "@/core/interfaces/wishlist-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "wishlistItems";

interface WishlistItemDoc extends Omit<WishlistItem, "id" | "addedAt"> {
  addedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): WishlistItem {
  const data = doc.data() as WishlistItemDoc;
  return { ...data, id: doc.id, addedAt: data.addedAt.toDate() };
}

export class FirestoreWishlistRepository implements WishlistRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async listByCustomer(customerUid: string): Promise<WishlistItem[]> {
    const snap = await this.db().collection(COLLECTION).where("customerUid", "==", customerUid).orderBy("addedAt", "desc").get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async add(customerUid: string, productId: string, variantId: string | null): Promise<WishlistItem> {
    const id = wishlistItemId(customerUid, productId, variantId);
    const ref = this.db().collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      return toDomain(existing as QueryDocumentSnapshot);
    }
    const item: WishlistItemDoc = { customerUid, productId, variantId, addedAt: Timestamp.now() };
    await ref.set(item);
    return { ...item, id, addedAt: item.addedAt.toDate() };
  }

  async remove(customerUid: string, productId: string, variantId: string | null): Promise<void> {
    const id = wishlistItemId(customerUid, productId, variantId);
    await this.db().collection(COLLECTION).doc(id).delete();
  }
}
