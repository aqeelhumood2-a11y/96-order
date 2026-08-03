import "server-only";
import { randomUUID } from "node:crypto";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Promotion } from "@/core/promotions/entities";
import type { PromotionRepository } from "@/core/interfaces/promotion-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "promotions";

interface PromotionDoc extends Omit<Promotion, "id" | "startsAt" | "endsAt" | "createdAt" | "updatedAt"> {
  startsAt: Timestamp | null;
  endsAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Promotion {
  const data = doc.data() as PromotionDoc;
  return {
    ...data,
    id: doc.id,
    startsAt: data.startsAt ? data.startsAt.toDate() : null,
    endsAt: data.endsAt ? data.endsAt.toDate() : null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

function toDoc(promotion: Promotion): PromotionDoc {
  return {
    name: promotion.name,
    type: promotion.type,
    value: promotion.value,
    scope: promotion.scope,
    startsAt: promotion.startsAt ? Timestamp.fromDate(promotion.startsAt) : null,
    endsAt: promotion.endsAt ? Timestamp.fromDate(promotion.endsAt) : null,
    active: promotion.active,
    priority: promotion.priority,
    stackable: promotion.stackable,
    createdAt: Timestamp.fromDate(promotion.createdAt),
    updatedAt: Timestamp.fromDate(promotion.updatedAt),
    createdBy: promotion.createdBy,
    updatedBy: promotion.updatedBy,
  };
}

export class FirestorePromotionRepository implements PromotionRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Promotion | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async listActive(): Promise<Promotion[]> {
    const snap = await this.db().collection(COLLECTION).where("active", "==", true).get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async create(promotion: Promotion): Promise<void> {
    await this.db()
      .collection(COLLECTION)
      .doc(promotion.id || randomUUID())
      .set(toDoc(promotion));
  }

  async update(id: string, patch: Partial<Promotion>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const current = toDomain(snap as QueryDocumentSnapshot);
    const next: Promotion = { ...current, ...patch, updatedAt: new Date() };
    await ref.set(toDoc(next));
  }

  async list(request: PageRequest): Promise<Page<Promotion>> {
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
}
