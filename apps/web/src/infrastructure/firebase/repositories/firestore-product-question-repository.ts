import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { ProductQuestion } from "@/core/questions/entities";
import type { ListQuestionsRequest, ProductQuestionRepository } from "@/core/interfaces/product-question-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "productQuestions";

interface QuestionDoc extends Omit<ProductQuestion, "id" | "createdAt" | "answeredAt"> {
  createdAt: Timestamp;
  answeredAt: Timestamp | null;
}

function toDomain(doc: QueryDocumentSnapshot): ProductQuestion {
  const data = doc.data() as QuestionDoc;
  return { ...data, id: doc.id, createdAt: data.createdAt.toDate(), answeredAt: data.answeredAt ? data.answeredAt.toDate() : null };
}

function toDoc(question: ProductQuestion): QuestionDoc {
  return {
    productId: question.productId,
    customerUid: question.customerUid,
    customerName: question.customerName,
    question: question.question,
    status: question.status,
    answer: question.answer,
    answeredAt: question.answeredAt ? Timestamp.fromDate(question.answeredAt) : null,
    answeredBy: question.answeredBy,
    createdAt: Timestamp.fromDate(question.createdAt),
  };
}

export class FirestoreProductQuestionRepository implements ProductQuestionRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<ProductQuestion | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async listApprovedByProduct(productId: string, request: PageRequest): Promise<Page<ProductQuestion>> {
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

  async listByCustomer(customerUid: string): Promise<ProductQuestion[]> {
    const snap = await this.db().collection(COLLECTION).where("customerUid", "==", customerUid).orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }

  async list(request: ListQuestionsRequest): Promise<Page<ProductQuestion>> {
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

  async create(question: ProductQuestion): Promise<void> {
    await this.db().collection(COLLECTION).doc(question.id).set(toDoc(question));
  }

  async update(id: string, patch: Partial<ProductQuestion>): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    const current = toDomain(snap as QueryDocumentSnapshot);
    const next: ProductQuestion = { ...current, ...patch };
    await ref.set(toDoc(next));
  }
}
