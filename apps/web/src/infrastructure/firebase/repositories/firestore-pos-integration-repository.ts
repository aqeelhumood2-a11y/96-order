import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { PosIntegrationSettings } from "@/core/integrations/entities";
import type { PosIntegrationRepository } from "@/core/interfaces/pos-integration-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "posIntegrationSettings";
const DOC_ID = "singleton";

interface PosIntegrationDoc extends Omit<PosIntegrationSettings, "updatedAt"> {
  updatedAt: Timestamp;
}

export class FirestorePosIntegrationRepository implements PosIntegrationRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async get(): Promise<PosIntegrationSettings | null> {
    const snap = await this.db().collection(COLLECTION).doc(DOC_ID).get();
    if (!snap.exists) return null;
    const data = snap.data() as PosIntegrationDoc;
    return { ...data, updatedAt: data.updatedAt.toDate() };
  }

  async set(settings: PosIntegrationSettings): Promise<void> {
    const doc: PosIntegrationDoc = { ...settings, updatedAt: Timestamp.fromDate(settings.updatedAt) };
    await this.db().collection(COLLECTION).doc(DOC_ID).set(doc);
  }
}
