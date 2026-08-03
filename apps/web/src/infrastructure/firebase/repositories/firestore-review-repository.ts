import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Review } from "@/core/reviews/entities";
import type { ListReviewsRequest, ReviewRepository } from "@/core/interfaces/review-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "reviews";

interface ReviewDoc extends Omit<Review, "id" | "createdAt" | "updatedAt" | "moderatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  moderatedAt: Timestamp | null;
}

function toDomain(doc: QueryDocumentSnapshot): Review {
  const data = doc.data() as ReviewDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate(), updatedAt: data.updatedAt.toDate(), moderatedAt: data.moderatedAt ? data.moderatedAt.toDate() : null };
}

function toDoc(review: Review): ReviewDoc {
  return {
    productId: review.productId,
    customerUid: review.customerUid,
    customerName: review.customerName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verifiedPurchase: review.verifiedPurchase,
    status: review.status,
    imageUrls: review.imageUrls,
    createdAt: Timestamp.fromDate(review.createdAt),
    updatedAt: Timestamp.fromDate(review.updatedAt),
    moderatedAt: review.moderatedAt ? Timestamp.fromDate(review.moderatedAt) : null,
    moderatedBy: review.moderatedBy,
  };
}

export class FirestoreReviewRepository implements ReviewRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Review | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findByCustomerAndProduct(customerUid: string, productId: string): Promise<Review | null> {
    return this.findById(`${customerUid}:${productId}`);
  }

  async listApprovedByProduct(productId: string, request: PageRequest): Promise<Page<Review>> {
    let query = this.db()
      .collection(COLLECTION)
      .where("productId", "==", productId)
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(request.limit);
    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async listByCustomer(customerUid: string): Promise<Review[]> {
    const snap = await this.db().collection(COLLECTION).where("customerUid", "==", customerUid).orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async list(request: ListReviewsRequest): Promise<Page<Review>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);
    if (request.status) {
      query = this.db().collection(COLLECTION).where("status", "==", request.status).orderBy("createdAt", "desc").limit(request.limit);
    }
    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async create(review: Review): Promise<void> {
    await this.db().collection(COLLECTION).doc(review.id).set(toDoc(review));
  }

  async update(id: string, patch: Partial<Review>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const current = toDomain(snap as QueryDocumentSnapshot);
    const next: Review = { ...current, ...patch, updatedAt: new Date() };
    await ref.set(toDoc(next));
  }

  async delete(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).delete();
  }
}
