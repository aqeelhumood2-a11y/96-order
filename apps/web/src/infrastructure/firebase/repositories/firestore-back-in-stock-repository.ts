import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import { backInStockSubscriptionId } from "@/core/back-in-stock/entities";
import type { BackInStockRepository } from "@/core/interfaces/back-in-stock-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "backInStockSubscriptions";

interface SubscriptionDoc extends Omit<BackInStockSubscription, "id" | "createdAt" | "notifiedAt"> {
  createdAt: Timestamp;
  notifiedAt: Timestamp | null;
}

function toDomain(doc: QueryDocumentSnapshot): BackInStockSubscription {
  const data = doc.data() as SubscriptionDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate(), notifiedAt: data.notifiedAt ? data.notifiedAt.toDate() : null };
}

function toDoc(subscription: BackInStockSubscription): SubscriptionDoc {
  return {
    customerUid: subscription.customerUid,
    email: subscription.email,
    productId: subscription.productId,
    variantId: subscription.variantId,
    status: subscription.status,
    unsubscribeToken: subscription.unsubscribeToken,
    createdAt: Timestamp.fromDate(subscription.createdAt),
    notifiedAt: subscription.notifiedAt ? Timestamp.fromDate(subscription.notifiedAt) : null,
  };
}

export class FirestoreBackInStockRepository implements BackInStockRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<BackInStockSubscription | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async listByCustomer(customerUid: string): Promise<BackInStockSubscription[]> {
    const snap = await this.db().collection(COLLECTION).where("customerUid", "==", customerUid).orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async listPendingByProduct(productId: string, variantId: string | null): Promise<BackInStockSubscription[]> {
    const snap = await this.db()
      .collection(COLLECTION)
      .where("productId", "==", productId)
      .where("variantId", "==", variantId)
      .where("status", "==", "pending")
      .get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async subscribe(subscription: BackInStockSubscription): Promise<BackInStockSubscription> {
    const id = backInStockSubscriptionId(subscription.email, subscription.productId, subscription.variantId);
    const ref = this.db().collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      const current = toDomain(existing as QueryDocumentSnapshot);
      if (current.status === "pending") {
        return current;
      }
      await ref.set({ status: "pending", notifiedAt: null }, { merge: true });
      return { ...current, status: "pending", notifiedAt: null };
    }

    const toWrite: BackInStockSubscription = { ...subscription, id };
    await ref.set(toDoc(toWrite));
    return toWrite;
  }

  async markNotified(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).set({ status: "notified", notifiedAt: Timestamp.now() }, { merge: true });
  }

  async cancel(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).set({ status: "cancelled" }, { merge: true });
  }

  async list(request: PageRequest): Promise<Page<BackInStockSubscription>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);
    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }
    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }
}
