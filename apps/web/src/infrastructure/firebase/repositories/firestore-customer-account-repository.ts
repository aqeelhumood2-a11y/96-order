import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { CustomerAccount } from "@/core/customer-auth/entities";
import type { CustomerAccountRepository } from "@/core/interfaces/customer-account-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "customerAccounts";

interface CustomerAccountDoc extends Omit<CustomerAccount, "uid" | "createdAt" | "updatedAt" | "lastLoginAt" | "deactivatedAt" | "marketingConsentUpdatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  deactivatedAt?: Timestamp;
  marketingConsentUpdatedAt?: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): CustomerAccount {
  const data = doc.data() as CustomerAccountDoc;
  return {
    ...data,
    uid: doc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    lastLoginAt: data.lastLoginAt?.toDate(),
    deactivatedAt: data.deactivatedAt?.toDate(),
    marketingConsentUpdatedAt: data.marketingConsentUpdatedAt?.toDate(),
  };
}

function toDoc(account: CustomerAccount): CustomerAccountDoc {
  return {
    email: account.email,
    displayName: account.displayName,
    mobile: account.mobile,
    status: account.status,
    emailVerified: account.emailVerified,
    marketingConsent: account.marketingConsent,
    marketingConsentUpdatedAt: account.marketingConsentUpdatedAt ? Timestamp.fromDate(account.marketingConsentUpdatedAt) : undefined,
    notificationPreferences: account.notificationPreferences,
    createdAt: Timestamp.fromDate(account.createdAt),
    updatedAt: Timestamp.fromDate(account.updatedAt),
    lastLoginAt: account.lastLoginAt ? Timestamp.fromDate(account.lastLoginAt) : undefined,
    deactivatedAt: account.deactivatedAt ? Timestamp.fromDate(account.deactivatedAt) : undefined,
  };
}

export class FirestoreCustomerAccountRepository implements CustomerAccountRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findByUid(uid: string): Promise<CustomerAccount | null> {
    const snap = await this.db().collection(COLLECTION).doc(uid).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findByEmail(email: string): Promise<CustomerAccount | null> {
    const snap = await this.db().collection(COLLECTION).where("email", "==", email).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async create(account: CustomerAccount): Promise<void> {
    await this.db().collection(COLLECTION).doc(account.uid).set(toDoc(account));
  }

  async update(uid: string, patch: Partial<CustomerAccount>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return;
    const current = toDomain(snap as QueryDocumentSnapshot);
    const next: CustomerAccount = { ...current, ...patch, updatedAt: new Date() };
    await ref.set(toDoc(next));
  }
}
