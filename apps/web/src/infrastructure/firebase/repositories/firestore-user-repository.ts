import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { StaffUser, StaffUserStatus } from "@/core/auth/entities";
import type { Permission } from "@/core/auth/permissions";
import { NotFoundError } from "@/core/errors";
import type { Page } from "@/core/interfaces/repository";
import type { ListUsersRequest, UserRepository } from "@/core/interfaces/user-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "users";

interface UserDoc {
  uid: string;
  email: string;
  displayName?: string;
  status: StaffUserStatus;
  roleIds: string[];
  directPermissions: Permission[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastLoginAt?: Timestamp;
  deactivatedAt?: Timestamp;
  deactivatedBy?: string;
}

function toDomain(doc: QueryDocumentSnapshot): StaffUser {
  const data = doc.data() as UserDoc;
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    status: data.status,
    roleIds: data.roleIds,
    directPermissions: data.directPermissions ?? [],
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
    lastLoginAt: data.lastLoginAt?.toDate(),
    deactivatedAt: data.deactivatedAt?.toDate(),
    deactivatedBy: data.deactivatedBy,
  };
}

export class FirestoreUserRepository implements UserRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findByUid(uid: string): Promise<StaffUser | null> {
    const snap = await this.db().collection(COLLECTION).doc(uid).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findByEmail(email: string): Promise<StaffUser | null> {
    const snap = await this.db().collection(COLLECTION).where("email", "==", email).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async list(request: ListUsersRequest): Promise<Page<StaffUser>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);

    if (request.status) {
      query = this.db()
        .collection(COLLECTION)
        .where("status", "==", request.status)
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

  async create(user: StaffUser): Promise<void> {
    const doc: UserDoc = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roleIds: user.roleIds,
      directPermissions: user.directPermissions,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt),
      createdBy: user.createdBy,
    };
    await this.db().collection(COLLECTION).doc(user.uid).set(doc);
  }

  async setStatus(uid: string, status: StaffUserStatus, changedBy: string): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError("Staff account not found.");

    await ref.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      ...(status === "deactivated"
        ? { deactivatedAt: FieldValue.serverTimestamp(), deactivatedBy: changedBy }
        : { deactivatedAt: FieldValue.delete(), deactivatedBy: FieldValue.delete() }),
    });
  }

  async assignRoles(uid: string, roleIds: string[]): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError("Staff account not found.");
    await ref.update({ roleIds, updatedAt: FieldValue.serverTimestamp() });
  }

  async setDirectPermissions(uid: string, permissions: Permission[]): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError("Staff account not found.");
    await ref.update({ directPermissions: permissions, updatedAt: FieldValue.serverTimestamp() });
  }

  async recordLogin(uid: string, at: Date): Promise<void> {
    await this.db().collection(COLLECTION).doc(uid).update({ lastLoginAt: Timestamp.fromDate(at) });
  }
}
