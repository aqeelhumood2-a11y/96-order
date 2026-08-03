import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { NewNotificationOutboxEntry, NotificationOutboxEntry } from "@/core/notification-outbox/entities";
import type { ListNotificationOutboxRequest, NotificationOutboxRepository } from "@/core/interfaces/notification-outbox-repository";
import type { Page } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "notificationOutbox";

interface NotificationOutboxDoc extends Omit<NotificationOutboxEntry, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): NotificationOutboxEntry {
  const data = doc.data() as NotificationOutboxDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate(), updatedAt: data.updatedAt.toDate() };
}

export class FirestoreNotificationOutboxRepository implements NotificationOutboxRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async enqueue(entry: NewNotificationOutboxEntry): Promise<NotificationOutboxEntry> {
    const ref = this.db().collection(COLLECTION).doc();
    const now = Timestamp.now();
    const doc: NotificationOutboxDoc = { ...entry, status: "pending", attempts: 0, createdAt: now, updatedAt: now };
    await ref.set(doc);
    return { ...doc, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  }

  async markSent(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).set({ status: "sent", attempts: (await this.currentAttempts(id)) + 1, updatedAt: Timestamp.now() }, { merge: true });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.db()
      .collection(COLLECTION)
      .doc(id)
      .set({ status: "failed", lastError: error, attempts: (await this.currentAttempts(id)) + 1, updatedAt: Timestamp.now() }, { merge: true });
  }

  async list(request: ListNotificationOutboxRequest): Promise<Page<NotificationOutboxEntry>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);
    if (request.status) {
      query = this.db().collection(COLLECTION).where("status", "==", request.status).orderBy("createdAt", "desc").limit(request.limit);
    }
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

  private async currentAttempts(id: string): Promise<number> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? ((snap.data() as NotificationOutboxDoc).attempts ?? 0) : 0;
  }

  async listRetryable(maxAttempts: number, limit: number): Promise<NotificationOutboxEntry[]> {
    const snap = await this.db()
      .collection(COLLECTION)
      .where("status", "==", "failed")
      .where("attempts", "<", maxAttempts)
      .orderBy("attempts", "asc")
      .orderBy("updatedAt", "asc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }
}
