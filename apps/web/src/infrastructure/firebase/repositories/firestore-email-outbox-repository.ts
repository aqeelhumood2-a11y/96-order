import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { EmailOutboxEntry, EmailOutboxRepository, NewEmailOutboxEntry } from "@/core/interfaces/email-outbox-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "emailOutbox";

interface EmailOutboxDoc extends Omit<EmailOutboxEntry, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirestoreEmailOutboxRepository implements EmailOutboxRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async enqueue(entry: NewEmailOutboxEntry): Promise<EmailOutboxEntry> {
    const ref = this.db().collection(COLLECTION).doc();
    const now = Timestamp.now();
    const doc: EmailOutboxDoc = { ...entry, status: "pending", attempts: 0, createdAt: now, updatedAt: now };
    await ref.set(doc);
    return { ...doc, id: ref.id, createdAt: now.toDate(), updatedAt: now.toDate() };
  }

  async markSent(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).set(
      { status: "sent", attempts: (await this.currentAttempts(id)) + 1, updatedAt: Timestamp.now() },
      { merge: true },
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).set(
      { status: "failed", lastError: error, attempts: (await this.currentAttempts(id)) + 1, updatedAt: Timestamp.now() },
      { merge: true },
    );
  }

  private async currentAttempts(id: string): Promise<number> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? ((snap.data() as EmailOutboxDoc).attempts ?? 0) : 0;
  }
}
