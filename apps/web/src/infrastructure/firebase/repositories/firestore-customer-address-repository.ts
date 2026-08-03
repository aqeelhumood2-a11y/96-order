import "server-only";
import { randomUUID } from "node:crypto";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { CustomerAddress } from "@/core/customer-address/entities";
import type { CustomerAddressRepository } from "@/core/interfaces/customer-address-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "customerAddresses";

interface AddressDoc extends Omit<CustomerAddress, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): CustomerAddress {
  const data = doc.data() as AddressDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate(), updatedAt: data.updatedAt.toDate() };
}

function toDoc(address: CustomerAddress): AddressDoc {
  return {
    customerUid: address.customerUid,
    label: address.label,
    customLabel: address.customLabel,
    recipientName: address.recipientName,
    recipientMobile: address.recipientMobile,
    address: address.address,
    isDefault: address.isDefault,
    createdAt: Timestamp.fromDate(address.createdAt),
    updatedAt: Timestamp.fromDate(address.updatedAt),
  };
}

export class FirestoreCustomerAddressRepository implements CustomerAddressRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async listByCustomer(customerUid: string): Promise<CustomerAddress[]> {
    const snap = await this.db().collection(COLLECTION).where("customerUid", "==", customerUid).orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async findById(id: string): Promise<CustomerAddress | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async create(address: CustomerAddress): Promise<void> {
    await this.db().collection(COLLECTION).doc(address.id || randomUUID()).set(toDoc(address));
  }

  async update(id: string, patch: Partial<CustomerAddress>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const current = toDomain(snap as QueryDocumentSnapshot);
    const next: CustomerAddress = { ...current, ...patch, updatedAt: new Date() };
    await ref.set(toDoc(next));
  }

  async delete(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).delete();
  }

  async setDefault(customerUid: string, addressId: string): Promise<void> {
    const db = this.db();
    await db.runTransaction(async (transaction) => {
      const othersSnap = await transaction.get(db.collection(COLLECTION).where("customerUid", "==", customerUid).where("isDefault", "==", true));
      const now = Timestamp.now();
      for (const doc of othersSnap.docs) {
        if (doc.id === addressId) continue;
        transaction.set(doc.ref, { isDefault: false, updatedAt: now }, { merge: true });
      }
      transaction.set(db.collection(COLLECTION).doc(addressId), { isDefault: true, updatedAt: now }, { merge: true });
    });
  }
}
