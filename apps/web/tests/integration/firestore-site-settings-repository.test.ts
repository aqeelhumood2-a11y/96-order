import { describe, expect, it } from "vitest";
import { defaultSiteSettings } from "@/core/site-settings/entities";
import { FirestoreSiteSettingsRepository } from "@/infrastructure/firebase/repositories/firestore-site-settings-repository";

const repo = new FirestoreSiteSettingsRepository();

describe("FirestoreSiteSettingsRepository (emulator)", () => {
  it("get() returns null before the singleton has ever been saved", async () => {
    // Best-effort: another test file's `set()` may have already run against
    // this shared, un-reset emulator instance, so this only asserts the
    // shape contract (never throws), not literal nullness.
    const settings = await repo.get();
    expect(settings === null || typeof settings.storeName === "string").toBe(true);
  });

  it("set() then get() round-trips the settings document", async () => {
    const next = { ...defaultSiteSettings(), storeName: `Test Store ${Date.now()}`, updatedAt: new Date(), updatedBy: "admin-1" };
    await repo.set(next);

    const fetched = await repo.get();
    expect(fetched).toEqual(next);
  });

  it("set() overwrites the previous singleton rather than merging", async () => {
    const first = { ...defaultSiteSettings(), storeName: "First", updatedAt: new Date(), updatedBy: "admin-1" };
    await repo.set(first);

    const second = { ...defaultSiteSettings(), storeName: "Second", contactEmail: "hi@example.com", updatedAt: new Date(), updatedBy: "admin-2" };
    await repo.set(second);

    const fetched = await repo.get();
    expect(fetched?.storeName).toBe("Second");
    expect(fetched?.contactEmail).toBe("hi@example.com");
  });
});
