import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Coupon } from "@/core/coupons/entities";
import type { CouponRepository } from "@/core/interfaces/coupon-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "coupons";
const REDEMPTIONS_COLLECTION = "couponRedemptions";

interface CouponDoc extends Omit<Coupon, "code" | "startsAt" | "endsAt" | "createdAt" | "updatedAt"> {
  startsAt: Timestamp | null;
  endsAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface RedemptionDoc {
  code: string;
  orderId: string;
  customerEmail: string;
  discountAmount: number;
  redeemedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Coupon {
  const data = doc.data() as CouponDoc;
  return {
    ...data,
    code: doc.id,
    startsAt: data.startsAt ? data.startsAt.toDate() : null,
    endsAt: data.endsAt ? data.endsAt.toDate() : null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

function toDoc(coupon: Coupon): CouponDoc {
  return {
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    scope: coupon.scope,
    excludedProductIds: coupon.excludedProductIds,
    excludedCategoryIds: coupon.excludedCategoryIds,
    minSubtotal: coupon.minSubtotal,
    maxDiscountCap: coupon.maxDiscountCap,
    startsAt: coupon.startsAt ? Timestamp.fromDate(coupon.startsAt) : null,
    endsAt: coupon.endsAt ? Timestamp.fromDate(coupon.endsAt) : null,
    active: coupon.active,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount,
    perCustomerLimit: coupon.perCustomerLimit,
    firstOrderOnly: coupon.firstOrderOnly,
    stackable: coupon.stackable,
    createdAt: Timestamp.fromDate(coupon.createdAt),
    updatedAt: Timestamp.fromDate(coupon.updatedAt),
    createdBy: coupon.createdBy,
    updatedBy: coupon.updatedBy,
  };
}

export class FirestoreCouponRepository implements CouponRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const snap = await this.db().collection(COLLECTION).doc(code).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async create(coupon: Coupon): Promise<void> {
    await this.db().collection(COLLECTION).doc(coupon.code).set(toDoc(coupon));
  }

  async update(code: string, patch: Partial<Coupon>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(code);
    const snap = await ref.get();
    if (!snap.exists) return;
    const current = toDomain(snap as QueryDocumentSnapshot);
    const next: Coupon = { ...current, ...patch, updatedAt: new Date() };
    await ref.set(toDoc(next));
  }

  async list(request: PageRequest): Promise<Page<Coupon>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);
    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async redeem(code: string, orderId: string, customerEmail: string, discountAmount: number): Promise<boolean> {
    const db = this.db();
    const couponRef = db.collection(COLLECTION).doc(code);
    const redemptionRef = db.collection(REDEMPTIONS_COLLECTION).doc(`${code}:${orderId}`);

    return db.runTransaction(async (transaction) => {
      const [couponSnap, redemptionSnap] = await Promise.all([transaction.get(couponRef), transaction.get(redemptionRef)]);
      if (redemptionSnap.exists) return true; // already redeemed for this exact order — idempotent retry

      if (!couponSnap.exists) return false;
      const coupon = couponSnap.data() as CouponDoc;
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return false;

      const redemption: RedemptionDoc = { code, orderId, customerEmail, discountAmount, redeemedAt: Timestamp.now() };
      transaction.set(redemptionRef, redemption);
      transaction.set(couponRef, { usageCount: coupon.usageCount + 1, updatedAt: Timestamp.now() }, { merge: true });
      return true;
    });
  }

  async countRedemptionsByCustomer(code: string, customerEmail: string): Promise<number> {
    const snap = await this.db().collection(REDEMPTIONS_COLLECTION).where("code", "==", code).where("customerEmail", "==", customerEmail).count().get();
    return snap.data().count;
  }
}
