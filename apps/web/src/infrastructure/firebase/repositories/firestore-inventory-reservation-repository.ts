import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { InventoryReservation } from "@/core/catalog/entities";
import { canDecreaseStock } from "@/core/catalog/rules";
import { ConflictError, NotFoundError } from "@/core/errors";
import type { InventoryReservationRepository, ReserveInventoryInput } from "@/core/interfaces/inventory-reservation-repository";
import { getAdminFirestore } from "../admin";

const RESERVATIONS_COLLECTION = "inventoryReservations";
const INVENTORY_COLLECTION = "inventory";
const ADJUSTMENTS_COLLECTION = "inventoryAdjustments";

/** Same collection/shape `FirestoreInventoryRepository` reads and writes — reservations mutate `reserved` on the identical record `adjust()` mutates `onHand` on. */
interface InventoryDoc {
  productId: string;
  variantId: string | null;
  onHand: number;
  reserved: number;
  lowStockThreshold?: number;
  updatedAt: Timestamp;
  updatedBy: string;
}

interface ReservationDoc {
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  status: InventoryReservation["status"];
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function reservationId(orderId: string, productId: string, variantId: string | null): string {
  return `${orderId}:${productId}:${variantId ?? "-"}`;
}

function inventoryRecordId(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "-"}`;
}

function toDomain(id: string, data: ReservationDoc): InventoryReservation {
  return {
    id,
    orderId: data.orderId,
    productId: data.productId,
    variantId: data.variantId,
    quantity: data.quantity,
    status: data.status,
    expiresAt: data.expiresAt.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

const EMPTY_INVENTORY = (productId: string, variantId: string | null, actorId: string): InventoryDoc => ({
  productId,
  variantId,
  onHand: 0,
  reserved: 0,
  updatedAt: Timestamp.now(),
  updatedBy: actorId,
});

export class FirestoreInventoryReservationRepository implements InventoryReservationRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async reserve(input: ReserveInventoryInput): Promise<InventoryReservation> {
    const db = this.db();
    const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc(reservationId(input.orderId, input.productId, input.variantId));
    const inventoryRef = db.collection(INVENTORY_COLLECTION).doc(inventoryRecordId(input.productId, input.variantId));

    return db.runTransaction(async (transaction) => {
      const existingSnap = await transaction.get(reservationRef);
      if (existingSnap.exists) {
        // Idempotent: a retried checkout submission for the same order+line
        // must never double-reserve.
        return toDomain(existingSnap.id, existingSnap.data() as ReservationDoc);
      }

      // Lazily reclaim this same product/variant's own expired-but-still-
      // "reserved" rows before checking availability — see
      // `InventoryReservation.expiresAt`'s doc comment for why this is a
      // per-key reclaim on next use, not a background sweep.
      const expiredQuery = db
        .collection(RESERVATIONS_COLLECTION)
        .where("productId", "==", input.productId)
        .where("variantId", "==", input.variantId)
        .where("status", "==", "reserved")
        .where("expiresAt", "<", Timestamp.now());
      const expiredSnap = await transaction.get(expiredQuery);

      const inventorySnap = await transaction.get(inventoryRef);
      const inventory: InventoryDoc = inventorySnap.exists
        ? (inventorySnap.data() as InventoryDoc)
        : EMPTY_INVENTORY(input.productId, input.variantId, input.actorId);

      const reclaimedQuantity = expiredSnap.docs.reduce((total, doc) => total + (doc.data() as ReservationDoc).quantity, 0);
      const effectiveReserved = inventory.reserved - reclaimedQuantity;

      if (!canDecreaseStock({ onHand: inventory.onHand, reserved: effectiveReserved }, input.quantity, input.allowBackorder)) {
        throw new ConflictError("Not enough available stock to reserve this quantity.");
      }

      for (const expiredDoc of expiredSnap.docs) {
        transaction.set(expiredDoc.ref, { status: "released", updatedAt: Timestamp.now() }, { merge: true });
      }

      const now = Timestamp.now();
      transaction.set(
        inventoryRef,
        { ...inventory, reserved: effectiveReserved + input.quantity, updatedAt: now, updatedBy: input.actorId },
        { merge: true },
      );

      const reservationDoc: ReservationDoc = {
        orderId: input.orderId,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        status: "reserved",
        expiresAt: Timestamp.fromDate(input.expiresAt),
        createdAt: now,
        updatedAt: now,
      };
      transaction.set(reservationRef, reservationDoc);

      return toDomain(reservationRef.id, reservationDoc);
    });
  }

  async release(orderId: string, productId: string, variantId: string | null, actorId: string): Promise<void> {
    const db = this.db();
    const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc(reservationId(orderId, productId, variantId));
    const inventoryRef = db.collection(INVENTORY_COLLECTION).doc(inventoryRecordId(productId, variantId));

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(reservationRef);
      if (!snap.exists) return;
      const reservation = snap.data() as ReservationDoc;
      if (reservation.status !== "reserved") return;

      const inventorySnap = await transaction.get(inventoryRef);
      if (inventorySnap.exists) {
        const inventory = inventorySnap.data() as InventoryDoc;
        transaction.set(
          inventoryRef,
          { ...inventory, reserved: Math.max(0, inventory.reserved - reservation.quantity), updatedAt: Timestamp.now(), updatedBy: actorId },
          { merge: true },
        );
      }
      transaction.set(reservationRef, { status: "released", updatedAt: Timestamp.now() }, { merge: true });
    });
  }

  async commit(orderId: string, productId: string, variantId: string | null, actorId: string): Promise<void> {
    const db = this.db();
    const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc(reservationId(orderId, productId, variantId));
    const inventoryRef = db.collection(INVENTORY_COLLECTION).doc(inventoryRecordId(productId, variantId));

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(reservationRef);
      if (!snap.exists) throw new NotFoundError("No reservation found to commit.");
      const reservation = snap.data() as ReservationDoc;
      if (reservation.status === "committed") return;
      if (reservation.status === "released") {
        throw new ConflictError("Cannot commit a reservation that was already released.");
      }

      const inventorySnap = await transaction.get(inventoryRef);
      const inventory: InventoryDoc = inventorySnap.exists
        ? (inventorySnap.data() as InventoryDoc)
        : EMPTY_INVENTORY(productId, variantId, actorId);

      const onHandBefore = inventory.onHand;
      const onHandAfter = onHandBefore - reservation.quantity;

      transaction.set(
        inventoryRef,
        {
          ...inventory,
          onHand: onHandAfter,
          reserved: Math.max(0, inventory.reserved - reservation.quantity),
          updatedAt: Timestamp.now(),
          updatedBy: actorId,
        },
        { merge: true },
      );

      const adjustmentRef = db.collection(ADJUSTMENTS_COLLECTION).doc();
      transaction.set(adjustmentRef, {
        inventoryId: inventoryRef.id,
        productId,
        variantId,
        reason: "order_fulfilled",
        quantityDelta: -reservation.quantity,
        onHandBefore,
        onHandAfter,
        note: `Order ${orderId} fulfilled`,
        actorId,
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.set(reservationRef, { status: "committed", updatedAt: Timestamp.now() }, { merge: true });
    });
  }

  async listByOrder(orderId: string): Promise<InventoryReservation[]> {
    const snap = await this.db().collection(RESERVATIONS_COLLECTION).where("orderId", "==", orderId).get();
    return snap.docs.map((doc) => toDomain(doc.id, doc.data() as ReservationDoc));
  }

  async listExpired(limit: number): Promise<InventoryReservation[]> {
    const snap = await this.db()
      .collection(RESERVATIONS_COLLECTION)
      .where("status", "==", "reserved")
      .where("expiresAt", "<", Timestamp.now())
      .orderBy("expiresAt", "asc")
      .limit(limit)
      .get();
    return snap.docs.map((doc) => toDomain(doc.id, doc.data() as ReservationDoc));
  }
}
