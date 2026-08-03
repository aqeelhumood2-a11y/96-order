import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { CustomerEmailVerificationRepository, EmailVerificationRecord } from "@/core/interfaces/customer-email-verification-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "customerEmailVerifications";

interface VerificationDoc {
  customerUid: string;
  email: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): EmailVerificationRecord {
  const data = doc.data() as VerificationDoc;
  return { tokenHash: doc.id, customerUid: data.customerUid, email: data.email, expiresAt: data.expiresAt.toDate(), createdAt: data.createdAt.toDate() };
}

export class FirestoreCustomerEmailVerificationRepository implements CustomerEmailVerificationRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async create(record: EmailVerificationRecord): Promise<void> {
    await this.db().collection(COLLECTION).doc(record.tokenHash).set({
      customerUid: record.customerUid,
      email: record.email,
      expiresAt: Timestamp.fromDate(record.expiresAt),
      createdAt: Timestamp.fromDate(record.createdAt),
    } satisfies VerificationDoc);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null> {
    const snap = await this.db().collection(COLLECTION).doc(tokenHash).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(tokenHash).delete();
  }

  async deleteAllForCustomer(customerUid: string): Promise<void> {
    const snap = await this.db().collection(COLLECTION).where("customerUid", "==", customerUid).get();
    await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
  }
}
