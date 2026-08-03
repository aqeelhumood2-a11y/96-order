import "server-only";
import type { Firestore, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Customer } from "@/core/customer/entities";
import type { CustomerRepository, ListCustomersRequest } from "@/core/interfaces/customer-repository";
import type { Page } from "@/core/interfaces/repository";
import { moneyFromDoc, moneyToDoc, type MoneyDoc } from "../money-mapping";
import { getAdminFirestore } from "../admin";

const COLLECTION = "customers";

interface CustomerDoc extends Omit<Customer, "id" | "totalSpent" | "firstOrderAt" | "lastOrderAt" | "createdAt" | "updatedAt"> {
  totalSpent: MoneyDoc;
  firstOrderAt: Timestamp;
  lastOrderAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Customer {
  const data = doc.data() as CustomerDoc;
  return {
    ...data,
    id: doc.id,
    totalSpent: moneyFromDoc(data.totalSpent),
    firstOrderAt: data.firstOrderAt.toDate(),
    lastOrderAt: data.lastOrderAt.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

function toDoc(customer: Customer): CustomerDoc {
  return {
    kind: customer.kind,
    userId: customer.userId,
    fullName: customer.fullName,
    email: customer.email,
    mobile: customer.mobile,
    companyName: customer.companyName,
    totalOrders: customer.totalOrders,
    totalSpent: moneyToDoc(customer.totalSpent),
    firstOrderAt: Timestamp.fromDate(customer.firstOrderAt),
    lastOrderAt: Timestamp.fromDate(customer.lastOrderAt),
    searchTokens: customer.searchTokens,
    createdAt: Timestamp.fromDate(customer.createdAt),
    updatedAt: Timestamp.fromDate(customer.updatedAt),
  };
}

export class FirestoreCustomerRepository implements CustomerRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Customer | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async list(request: ListCustomersRequest): Promise<Page<Customer>> {
    let query: Query = this.db().collection(COLLECTION);

    if (request.search) {
      query = query.where("searchTokens", "array-contains", request.search);
    }
    query = query.orderBy("lastOrderAt", "desc").limit(request.limit);

    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  /**
   * Transactional read-modify-write — see `CustomerRepository.upsert`'s
   * doc comment for why two concurrent first-time orders from the same
   * new customer must never both observe `existing: null`.
   */
  async upsert(customerId: string, fold: (existing: Customer | null) => Customer): Promise<Customer> {
    const ref = this.db().collection(COLLECTION).doc(customerId);
    return this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const existing = snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
      const next = fold(existing);
      transaction.set(ref, toDoc(next));
      return next;
    });
  }
}
