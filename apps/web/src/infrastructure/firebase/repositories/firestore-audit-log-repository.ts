import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { AuditLogEntry, NewAuditLogEntry } from "@/core/auth/entities";
import type { AuditLogRepository, ListAuditLogsRequest } from "@/core/interfaces/audit-log-repository";
import type { Page } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "auditLogs";

interface AuditLogDoc extends Omit<AuditLogEntry, "id" | "createdAt"> {
  createdAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): AuditLogEntry {
  const data = doc.data() as AuditLogDoc;
  return {
    id: doc.id,
    type: data.type,
    actorUid: data.actorUid,
    actorEmail: data.actorEmail,
    targetUid: data.targetUid,
    metadata: data.metadata,
    createdAt: data.createdAt.toDate(),
  };
}

/**
 * Append-only by construction: this class has no update/delete method, and
 * neither does the `AuditLogRepository` port it implements.
 */
export class FirestoreAuditLogRepository implements AuditLogRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async record(entry: NewAuditLogEntry): Promise<AuditLogEntry> {
    const now = Timestamp.now();
    const doc: AuditLogDoc = {
      type: entry.type,
      actorUid: entry.actorUid,
      actorEmail: entry.actorEmail,
      targetUid: entry.targetUid,
      metadata: entry.metadata,
      createdAt: now,
    };
    const ref = await this.db().collection(COLLECTION).add(doc);
    return { id: ref.id, ...entry, createdAt: now.toDate() };
  }

  async list(request: ListAuditLogsRequest): Promise<Page<AuditLogEntry>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);

    if (request.type) {
      query = this.db()
        .collection(COLLECTION)
        .where("type", "==", request.type)
        .orderBy("createdAt", "desc")
        .limit(request.limit);
    }

    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const items = snap.docs.map(toDomain);
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }
}
