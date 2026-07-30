import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Payment } from "@/core/payments/entities";
import type { PaymentRepository } from "@/core/interfaces/payment-repository";
import { moneyFromDoc, moneyToDoc, type MoneyDoc } from "../money-mapping";
import { getAdminFirestore } from "../admin";

const COLLECTION = "payments";

interface PaymentDoc extends Omit<Payment, "id" | "amount" | "createdAt" | "updatedAt"> {
  amount: MoneyDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Payment {
  const data = doc.data() as PaymentDoc;
  return { ...data, id: doc.id, amount: moneyFromDoc(data.amount), createdAt: data.createdAt.toDate(), updatedAt: data.updatedAt.toDate() };
}

function toDoc(payment: Payment): PaymentDoc {
  return {
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: moneyToDoc(payment.amount),
    currency: payment.currency,
    providerReference: payment.providerReference,
    failureReason: payment.failureReason,
    createdAt: Timestamp.fromDate(payment.createdAt),
    updatedAt: Timestamp.fromDate(payment.updatedAt),
  };
}

export class FirestorePaymentRepository implements PaymentRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Payment | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const snap = await this.db().collection(COLLECTION).where("orderId", "==", orderId).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async findByProviderReference(providerReference: string): Promise<Payment | null> {
    const snap = await this.db().collection(COLLECTION).where("providerReference", "==", providerReference).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async create(payment: Payment): Promise<void> {
    await this.db().collection(COLLECTION).doc(payment.id).set(toDoc(payment));
  }

  async update(id: string, patch: Partial<Payment>): Promise<void> {
    const patchDoc: Record<string, unknown> = { ...patch, updatedAt: Timestamp.now() };
    if (patch.amount) patchDoc.amount = moneyToDoc(patch.amount);
    await this.db().collection(COLLECTION).doc(id).set(patchDoc, { merge: true });
  }
}
