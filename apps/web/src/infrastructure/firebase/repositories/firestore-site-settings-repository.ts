import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { SiteSettings } from "@/core/site-settings/entities";
import type { SiteSettingsRepository } from "@/core/interfaces/site-settings-repository";
import { getAdminFirestore } from "../admin";

const COLLECTION = "siteSettings";
const DOC_ID = "singleton";

interface SiteSettingsDoc extends Omit<SiteSettings, "updatedAt"> {
  updatedAt: Timestamp;
}

export class FirestoreSiteSettingsRepository implements SiteSettingsRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async get(): Promise<SiteSettings | null> {
    const snap = await this.db().collection(COLLECTION).doc(DOC_ID).get();
    if (!snap.exists) return null;
    const data = snap.data() as SiteSettingsDoc;
    return { ...data, updatedAt: data.updatedAt.toDate() };
  }

  async set(settings: SiteSettings): Promise<void> {
    const doc: SiteSettingsDoc = { ...settings, updatedAt: Timestamp.fromDate(settings.updatedAt) };
    await this.db().collection(COLLECTION).doc(DOC_ID).set(doc);
  }
}
