import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Role } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import type { RoleRepository } from "@/core/interfaces/role-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "roles";

interface RoleDoc extends Omit<Role, "id" | "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Role {
  const data = doc.data() as RoleDoc;
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    permissions: data.permissions,
    isSystemRole: data.isSystemRole,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
}

export class FirestoreRoleRepository implements RoleRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Role | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async list(request: PageRequest): Promise<Page<Role>> {
    let query = this.db().collection(COLLECTION).orderBy("name", "asc").limit(request.limit);

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

  async create(role: Role): Promise<void> {
    const doc: RoleDoc = {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystemRole: role.isSystemRole,
      createdAt: Timestamp.fromDate(role.createdAt),
      updatedAt: Timestamp.fromDate(role.updatedAt),
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
    };
    await this.db().collection(COLLECTION).doc(role.id).set(doc);
  }

  async update(
    id: string,
    patch: Partial<Pick<Role, "name" | "description" | "permissions" | "updatedBy">>,
  ): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError("Role not found.");
    await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
  }

  async delete(id: string): Promise<void> {
    await this.db().collection(COLLECTION).doc(id).delete();
  }
}
