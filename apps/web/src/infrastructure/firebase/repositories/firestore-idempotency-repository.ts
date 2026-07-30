import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { IdempotencyRecord, IdempotencyRepository } from "@/core/interfaces/idempotency-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "checkoutIdempotency";

interface IdempotencyDoc {
  scope: string;
  key: string;
  status: IdempotencyRecord["status"];
  resultRef?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function docId(scope: string, key: string): string {
  return `${scope}:${key}`;
}

function toDomain(data: IdempotencyDoc): IdempotencyRecord {
  return {
    scope: data.scope,
    key: data.key,
    status: data.status,
    resultRef: data.resultRef,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

export class FirestoreIdempotencyRepository implements IdempotencyRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async begin(scope: string, key: string): Promise<{ record: IdempotencyRecord; created: boolean }> {
    const ref = this.db().collection(COLLECTION).doc(docId(scope, key));

    return this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (snap.exists) {
        return { record: toDomain(snap.data() as IdempotencyDoc), created: false };
      }

      const now = Timestamp.now();
      const doc: IdempotencyDoc = { scope, key, status: "in_progress", createdAt: now, updatedAt: now };
      transaction.set(ref, doc);
      return { record: toDomain(doc), created: true };
    });
  }

  async complete(scope: string, key: string, resultRef: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(docId(scope, key)).set(
      { status: "completed", resultRef, updatedAt: Timestamp.now() },
      { merge: true },
    );
  }

  async fail(scope: string, key: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(docId(scope, key)).set(
      { status: "failed", updatedAt: Timestamp.now() },
      { merge: true },
    );
  }
}
