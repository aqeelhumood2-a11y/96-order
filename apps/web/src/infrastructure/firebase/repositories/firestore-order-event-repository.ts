import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NewOrderStatusEvent, OrderStatusEvent } from "@/core/orders/entities";
import type { OrderEventRepository } from "@/core/interfaces/order-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "orderEvents";

interface OrderEventDoc extends Omit<OrderStatusEvent, "id" | "createdAt"> {
  createdAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): OrderStatusEvent {
  const data = doc.data() as OrderEventDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate() };
}

/** Append-only, mirroring `FirestoreAuditLogRepository` — no update/delete method exists on the port at all. */
export class FirestoreOrderEventRepository implements OrderEventRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async record(event: NewOrderStatusEvent): Promise<OrderStatusEvent> {
    const ref = this.db().collection(COLLECTION).doc();
    const approximateCreatedAt = new Date();
    await ref.set({ ...event, createdAt: FieldValue.serverTimestamp() });
    return { ...event, id: ref.id, createdAt: approximateCreatedAt };
  }

  async listByOrder(orderId: string): Promise<OrderStatusEvent[]> {
    const snap = await this.db().collection(COLLECTION).where("orderId", "==", orderId).orderBy("createdAt", "asc").get();
    return snap.docs.map(toDomain);
  }
}
