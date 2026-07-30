import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Cart, CartLine } from "@/core/cart/entities";
import type { CartRepository } from "@/core/interfaces/cart-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "carts";

interface CartLineDoc extends Omit<CartLine, "addedAt"> {
  addedAt: Timestamp;
}

interface CartDoc {
  customerId: string | null;
  lines: CartLineDoc[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Cart {
  const data = doc.data() as CartDoc;
  return {
    id: doc.id,
    customerId: data.customerId,
    lines: data.lines.map((line) => ({ ...line, addedAt: line.addedAt.toDate() })),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    expiresAt: data.expiresAt.toDate(),
  };
}

function toDoc(cart: Cart): CartDoc {
  return {
    customerId: cart.customerId,
    lines: cart.lines.map((line) => ({ ...line, addedAt: Timestamp.fromDate(line.addedAt) })),
    createdAt: Timestamp.fromDate(cart.createdAt),
    updatedAt: Timestamp.fromDate(cart.updatedAt),
    expiresAt: Timestamp.fromDate(cart.expiresAt),
  };
}

export class FirestoreCartRepository implements CartRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Cart | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async upsert(cart: Cart): Promise<void> {
    await this.db().collection(COLLECTION).doc(cart.id).set(toDoc(cart));
  }

  async delete(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).delete();
  }
}
