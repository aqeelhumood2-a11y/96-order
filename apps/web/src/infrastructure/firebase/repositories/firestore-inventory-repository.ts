import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { InventoryRecord } from "@/core/catalog/entities";
import { canDecreaseStock } from "@/core/catalog/rules";
import { ConflictError } from "@/core/errors";
import type { AdjustInventoryInput, AdjustInventoryResult, InventoryRepository } from "@/core/interfaces/inventory-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "inventory";
const ADJUSTMENTS_COLLECTION = "inventoryAdjustments";

/** Deterministic so a lookup or the adjust transaction never needs a query — just `.doc(recordId(...))`. */
function recordId(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "-"}`;
}

interface InventoryDoc extends Omit<InventoryRecord, "id" | "updatedAt"> {
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): InventoryRecord {
  const data = doc.data() as InventoryDoc;
  return {
    id: doc.id,
    productId: data.productId,
    variantId: data.variantId,
    onHand: data.onHand,
    reserved: data.reserved,
    lowStockThreshold: data.lowStockThreshold,
    updatedAt: data.updatedAt.toDate(),
    updatedBy: data.updatedBy,
  };
}

export class FirestoreInventoryRepository implements InventoryRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findByProductAndVariant(productId: string, variantId: string | null): Promise<InventoryRecord | null> {
    const snap = await this.db().collection(COLLECTION).doc(recordId(productId, variantId)).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async listByProduct(productId: string): Promise<InventoryRecord[]> {
    const snap = await this.db().collection(COLLECTION).where("productId", "==", productId).get();
    return snap.docs.map(toDomain);
  }

  async listLowStock(limit: number): Promise<InventoryRecord[]> {
    // Firestore can't express "onHand - reserved <= lowStockThreshold" as a
    // single-field query (it's a comparison between two stored fields, and
    // Firestore range filters only compare a field against a fixed value).
    // Inventory records are expected to stay in the low thousands for the
    // foreseeable catalog size, so filtering in memory after a bounded scan
    // is the pragmatic choice here over maintaining a separate denormalized
    // "isLowStock" boolean that would need updating on every adjustment AND
    // every threshold edit. Revisit if/when the catalog outgrows this.
    const snap = await this.db().collection(COLLECTION).limit(2000).get();
    const records = snap.docs.map(toDomain);
    return records
      .filter((record) => record.lowStockThreshold !== undefined && record.onHand - record.reserved <= record.lowStockThreshold)
      .slice(0, limit);
  }

  async ensureExists(
    productId: string,
    variantId: string | null,
    lowStockThreshold: number | undefined,
    actorId: string,
  ): Promise<InventoryRecord> {
    const ref = this.db().collection(COLLECTION).doc(recordId(productId, variantId));
    const snap = await ref.get();
    if (snap.exists) return toDomain(snap as QueryDocumentSnapshot);

    const doc: InventoryDoc = {
      productId,
      variantId,
      onHand: 0,
      reserved: 0,
      lowStockThreshold,
      updatedAt: Timestamp.now(),
      updatedBy: actorId,
    };
    await ref.set(doc, { merge: true });
    const written = await ref.get();
    return toDomain(written as QueryDocumentSnapshot);
  }

  async adjust(input: AdjustInventoryInput): Promise<AdjustInventoryResult> {
    const db = this.db();
    const ref = db.collection(COLLECTION).doc(recordId(input.productId, input.variantId));

    return db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const current: InventoryDoc = snap.exists
        ? (snap.data() as InventoryDoc)
        : { productId: input.productId, variantId: input.variantId, onHand: 0, reserved: 0, updatedAt: Timestamp.now(), updatedBy: input.actorId };

      const onHandBefore = current.onHand;
      const onHandAfter = onHandBefore + input.quantityDelta;

      if (input.quantityDelta < 0) {
        const wouldGoNegative = !canDecreaseStock(
          { onHand: onHandBefore, reserved: current.reserved },
          -input.quantityDelta,
          input.allowBackorder,
        );
        if (wouldGoNegative) {
          throw new ConflictError("This adjustment would take available stock negative and backorder isn't allowed for this item.");
        }
      }

      const updatedRecord: InventoryDoc = {
        ...current,
        onHand: onHandAfter,
        updatedAt: Timestamp.now(),
        updatedBy: input.actorId,
      };
      transaction.set(ref, updatedRecord, { merge: true });

      const adjustmentRef = db.collection(ADJUSTMENTS_COLLECTION).doc();
      const approximateCreatedAt = new Date();
      transaction.set(adjustmentRef, {
        inventoryId: ref.id,
        productId: input.productId,
        variantId: input.variantId,
        reason: input.reason,
        quantityDelta: input.quantityDelta,
        onHandBefore,
        onHandAfter,
        note: input.note,
        actorId: input.actorId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // The returned `adjustment.createdAt` is this transaction's local
      // commit-time approximation, not a re-read of the server-assigned
      // value — Firestore transactions can't read after they've written,
      // so an exact re-read isn't possible here. The persisted document
      // itself always carries the real `FieldValue.serverTimestamp()`
      // (set above); this approximation is only ever used by the immediate
      // caller (e.g. for audit-log metadata), never trusted as the
      // authoritative record.
      return {
        record: { id: ref.id, ...updatedRecord, updatedAt: updatedRecord.updatedAt.toDate() },
        adjustment: {
          id: adjustmentRef.id,
          inventoryId: ref.id,
          productId: input.productId,
          variantId: input.variantId,
          reason: input.reason,
          quantityDelta: input.quantityDelta,
          onHandBefore,
          onHandAfter,
          note: input.note,
          actorId: input.actorId,
          createdAt: approximateCreatedAt,
        },
      };
    });
  }
}
