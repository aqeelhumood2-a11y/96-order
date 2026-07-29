import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";

const repo = new FirestoreAuditLogRepository();

describe("FirestoreAuditLogRepository (emulator)", () => {
  it("records an entry and assigns it an id and createdAt", async () => {
    const actorUid = randomUUID();
    const entry = await repo.record({ type: "login_success", actorUid, actorEmail: "a@example.com", metadata: {} });

    expect(entry.id).toBeTruthy();
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.actorUid).toBe(actorUid);
  });

  it("lists entries filtered by type, most recent first", async () => {
    const marker = randomUUID();
    await repo.record({ type: "staff_created", actorUid: null, metadata: { marker } });
    await repo.record({ type: "staff_created", actorUid: null, metadata: { marker } });
    await repo.record({ type: "role_created", actorUid: null, metadata: { marker } });

    const page = await repo.list({ limit: 10, type: "staff_created" });
    const matching = page.items.filter((item) => item.metadata.marker === marker);
    expect(matching).toHaveLength(2);
    expect(matching.every((item) => item.type === "staff_created")).toBe(true);
  });

  it("has no update or delete method — append-only is enforced by the port's shape", () => {
    expect((repo as unknown as Record<string, unknown>).update).toBeUndefined();
    expect((repo as unknown as Record<string, unknown>).delete).toBeUndefined();
  });
});
