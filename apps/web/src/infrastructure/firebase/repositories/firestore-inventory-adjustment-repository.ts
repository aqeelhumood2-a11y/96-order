import "server-only";
import type { Firestore, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { InventoryAdjustment } from "@/core/catalog/entities";
import type {
  InventoryAdjustmentRepository,
  ListInventoryAdjustmentsRequest,
} from "@/core/interfaces/inventory-adjustment-repository";
import type { Page } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "inventoryAdjustments";

interface InventoryAdjustmentDoc extends Omit<InventoryAdjustment, "id" | "createdAt"> {
  createdAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): InventoryAdjustment {
  const data = doc.data() as InventoryAdjustmentDoc;
  return {
    id: doc.id,
    inventoryId: data.inventoryId,
    productId: data.productId,
    variantId: data.variantId,
    reason: data.reason,
    quantityDelta: data.quantityDelta,
    onHandBefore: data.onHandBefore,
    onHandAfter: data.onHandAfter,
    note: data.note,
    actorId: data.actorId,
    createdAt: data.createdAt.toDate(),
  };
}

/**
 * Read-only, matching the port: entries are only ever written by
 * `FirestoreInventoryRepository.adjust()`'s transaction, so this class has
 * no create/update/delete method at all — the same append-only-by-shape
 * guarantee Phase 2 established for audit logs.
 */
export class FirestoreInventoryAdjustmentRepository implements InventoryAdjustmentRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async list(request: ListInventoryAdjustmentsRequest): Promise<Page<InventoryAdjustment>> {
    let query: Query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);

    if (request.productId) {
      query = query.where("productId", "==", request.productId);
    }
    if (request.variantId !== undefined) {
      query = query.where("variantId", "==", request.variantId);
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
}
