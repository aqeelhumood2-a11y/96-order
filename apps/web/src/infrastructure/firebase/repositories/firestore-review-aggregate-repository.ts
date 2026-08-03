import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { ReviewAggregate } from "@/core/reviews/aggregate";
import type { ReviewAggregateRepository } from "@/core/interfaces/review-aggregate-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "reviewAggregates";

interface AggregateDoc {
  sum: number;
  count: number;
  updatedAt: Timestamp;
}

export class FirestoreReviewAggregateRepository implements ReviewAggregateRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findByProduct(productId: string): Promise<ReviewAggregate | null> {
    const snap = await this.db().collection(COLLECTION).doc(productId).get();
    if (!snap.exists) return null;
    const data = snap.data() as AggregateDoc;
    return { productId, sum: data.sum, count: data.count, updatedAt: data.updatedAt.toDate() };
  }

  async applyRatingChange(productId: string, sumDelta: number, countDelta: number): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(productId);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const current = snap.exists ? (snap.data() as AggregateDoc) : { sum: 0, count: 0 };
      transaction.set(ref, { sum: current.sum + sumDelta, count: Math.max(0, current.count + countDelta), updatedAt: Timestamp.now() });
    });
  }
}
