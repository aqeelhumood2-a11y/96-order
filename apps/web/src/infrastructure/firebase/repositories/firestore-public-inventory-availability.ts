import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { computeAvailability } from "@/core/storefront/rules";
import type { PublicAvailability } from "@/core/storefront/dto";
import type {
  AvailabilityRequest,
  PublicInventoryAvailabilityPort,
} from "@/core/interfaces/public-inventory-availability-port";
import { getAdminFirestore } from "../admin";

const COLLECTION = "inventory";

interface InventoryDoc {
  onHand: number;
  reserved: number;
  lowStockThreshold?: number;
}

function recordId(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "-"}`;
}

/**
 * Reads the same `inventory` collection Phase 3's `FirestoreInventoryRepository`
 * writes, but only ever returns the derived `PublicAvailability` booleans —
 * never `onHand`/`reserved` and never the adjustment ledger. This is a
 * separate, read-only adapter (not a reuse of the admin `InventoryRepository`
 * port) specifically so it can batch reads across many different products
 * in one round trip via `Firestore.getAll()`, which a per-product admin
 * lookup wasn't designed for.
 */
export class FirestorePublicInventoryAvailability implements PublicInventoryAvailabilityPort {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async getAvailability(request: AvailabilityRequest): Promise<PublicAvailability> {
    if (!request.trackInventory) {
      return computeAvailability(null, request.allowBackorder, request.trackInventory);
    }
    const doc = await this.db().collection(COLLECTION).doc(recordId(request.productId, request.variantId)).get();
    const record = doc.exists ? (doc.data() as InventoryDoc) : null;
    return computeAvailability(record, request.allowBackorder, request.trackInventory);
  }

  async getAvailabilityForMany(requests: readonly AvailabilityRequest[]): Promise<PublicAvailability[]> {
    const trackedIndexes = requests.map((request, index) => (request.trackInventory ? index : -1)).filter((index) => index !== -1);

    if (trackedIndexes.length === 0) {
      return requests.map((request) => computeAvailability(null, request.allowBackorder, request.trackInventory));
    }

    const refs = trackedIndexes.map((index) => {
      const request = requests[index]!;
      return this.db().collection(COLLECTION).doc(recordId(request.productId, request.variantId));
    });
    const snaps = await this.db().getAll(...refs);

    const recordByIndex = new Map<number, InventoryDoc | null>();
    trackedIndexes.forEach((requestIndex, snapIndex) => {
      const snap = snaps[snapIndex]!;
      recordByIndex.set(requestIndex, snap.exists ? (snap.data() as InventoryDoc) : null);
    });

    return requests.map((request, index) =>
      computeAvailability(recordByIndex.get(index) ?? null, request.allowBackorder, request.trackInventory),
    );
  }
}
