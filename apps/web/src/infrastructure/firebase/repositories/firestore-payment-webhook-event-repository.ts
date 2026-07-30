import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { PaymentWebhookEvent } from "@/core/payments/entities";
import type { PaymentWebhookEventRepository } from "@/core/interfaces/payment-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "paymentEvents";

interface PaymentWebhookEventDoc extends Omit<PaymentWebhookEvent, "id" | "receivedAt" | "processedAt"> {
  receivedAt: Timestamp;
  processedAt: Timestamp | null;
}

function toDomain(id: string, data: PaymentWebhookEventDoc): PaymentWebhookEvent {
  return { ...data, id, receivedAt: data.receivedAt.toDate(), processedAt: data.processedAt?.toDate() ?? null };
}

/**
 * Keyed by the provider's own event id, not an auto-generated one — a
 * `set()` (not `create()`/`add()`) on a doc that already exists is exactly
 * how a redelivered webhook is recognized as a duplicate before this
 * repository is even asked to do anything with it (see
 * `services/payments/handle-tap-webhook.ts`, which calls `findById` first).
 */
export class FirestorePaymentWebhookEventRepository implements PaymentWebhookEventRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<PaymentWebhookEvent | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap.id, snap.data() as PaymentWebhookEventDoc) : null;
  }

  async record(event: PaymentWebhookEvent): Promise<void> {
    const doc: PaymentWebhookEventDoc = {
      provider: event.provider,
      paymentId: event.paymentId,
      eventType: event.eventType,
      receivedAt: Timestamp.fromDate(event.receivedAt),
      processedAt: event.processedAt ? Timestamp.fromDate(event.processedAt) : null,
    };
    await this.db().collection(COLLECTION).doc(event.id).set(doc);
  }

  async markProcessed(id: string, processedAt: Date): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).set({ processedAt: Timestamp.fromDate(processedAt) }, { merge: true });
  }
}
