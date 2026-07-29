import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
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
 * neither does the `AuditLogRepository` port it implements — nothing in
 * `services/` or `features/` can modify or remove an entry through this or
 * any other application code path, because no such method exists to call.
 *
 * `createdAt` uses Firestore's own server clock (`FieldValue.serverTimestamp()`),
 * not a value computed by this Node process (`Timestamp.now()`), so the
 * persisted timestamp can't be skewed by the calling machine's clock.
 *
 * Firestore Security Rules do not apply to this Admin SDK client at all —
 * append-only here is an application-code guarantee, not a rules one. The
 * operational security boundary against someone bypassing the application
 * entirely (e.g. writing to Firestore directly via `gcloud`/console) is
 * IAM: whoever has the service account / project role that can write to
 * this project's Firestore can do so regardless of what this repository
 * exposes. See the Phase 2 README's audit-immutability section.
 */
export class FirestoreAuditLogRepository implements AuditLogRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async record(entry: NewAuditLogEntry): Promise<AuditLogEntry> {
    const doc = {
      type: entry.type,
      actorUid: entry.actorUid,
      actorEmail: entry.actorEmail,
      targetUid: entry.targetUid,
      metadata: entry.metadata,
      createdAt: FieldValue.serverTimestamp(),
    };
    const ref = await this.db().collection(COLLECTION).add(doc);
    const written = await ref.get();
    return toDomain(written as QueryDocumentSnapshot);
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
