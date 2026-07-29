import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_VARS = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:abc123",
};

describe("getEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    for (const key of Object.keys(REQUIRED_VARS)) {
      delete process.env[key];
    }
    delete process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns parsed values when all required vars are present", async () => {
    Object.assign(process.env, REQUIRED_VARS);
    const { getEnv } = await import("@/lib/env");

    expect(getEnv()).toMatchObject({
      ...REQUIRED_VARS,
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: false,
    });
  });

  it("throws a descriptive error when a required var is missing", async () => {
    const partial = { ...REQUIRED_VARS };
    delete (partial as Partial<typeof REQUIRED_VARS>).NEXT_PUBLIC_FIREBASE_API_KEY;
    Object.assign(process.env, partial);
    const { getEnv } = await import("@/lib/env");

    expect(() => getEnv()).toThrow(/NEXT_PUBLIC_FIREBASE_API_KEY/);
  });

  it("coerces NEXT_PUBLIC_USE_FIREBASE_EMULATORS to a boolean", async () => {
    Object.assign(process.env, REQUIRED_VARS, { NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true" });
    const { getEnv } = await import("@/lib/env");

    expect(getEnv().NEXT_PUBLIC_USE_FIREBASE_EMULATORS).toBe(true);
  });
});
