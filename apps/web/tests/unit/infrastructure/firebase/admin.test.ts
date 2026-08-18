import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAppsMock = vi.fn<() => unknown[]>(() => []);
const initializeAppMock = vi.fn((options: Record<string, unknown>) => ({ __options: options }));
const applicationDefaultMock = vi.fn(() => ({ __credential: "adc" }));
const certMock = vi.fn((options: Record<string, unknown>) => ({ __credential: "cert", options }));

vi.mock("firebase-admin/app", () => ({
  getApps: () => getAppsMock(),
  initializeApp: (options: Record<string, unknown>) => initializeAppMock(options),
  applicationDefault: () => applicationDefaultMock(),
  cert: (options: Record<string, unknown>) => certMock(options),
}));

vi.mock("firebase-admin/auth", () => ({ getAuth: vi.fn() }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: vi.fn() }));
vi.mock("firebase-admin/storage", () => ({ getStorage: vi.fn() }));

const ENV_KEYS = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_USE_FIREBASE_EMULATORS",
] as const;

const originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

async function importFreshAdminModule() {
  vi.resetModules();
  return import("@/infrastructure/firebase/admin");
}

describe("infrastructure/firebase/admin", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
    getAppsMock.mockReset().mockReturnValue([]);
    initializeAppMock.mockReset().mockImplementation((options) => ({ __options: options }));
    applicationDefaultMock.mockReset().mockReturnValue({ __credential: "adc" });
    certMock.mockReset().mockImplementation((options) => ({ __credential: "cert", options }));
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("initializes with cert() when all three FIREBASE_ADMIN_* values are present", async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = "prod-project";
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = "sa@prod-project.iam.gserviceaccount.com";
    process.env.FIREBASE_ADMIN_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY-----\nline-one\nline-two\n-----END PRIVATE KEY-----\n";

    const { getAdminApp } = await importFreshAdminModule();
    getAdminApp();

    expect(certMock).toHaveBeenCalledWith({
      projectId: "prod-project",
      clientEmail: "sa@prod-project.iam.gserviceaccount.com",
      // Trailing whitespace/newline is trimmed as part of hardening against
      // paste artifacts — see the "trims surrounding whitespace and quotes"
      // test below.
      privateKey: "-----BEGIN PRIVATE KEY-----\nline-one\nline-two\n-----END PRIVATE KEY-----",
    });
    expect(applicationDefaultMock).not.toHaveBeenCalled();
    expect(initializeAppMock).toHaveBeenCalledWith(expect.objectContaining({ projectId: "prod-project" }));
  });

  it("normalizes escaped \\n sequences in the private key before passing it to cert()", async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = "prod-project";
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = "sa@prod-project.iam.gserviceaccount.com";
    process.env.FIREBASE_ADMIN_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY-----\\nline-one\\nline-two\\n-----END PRIVATE KEY-----\\n";

    const { getAdminApp } = await importFreshAdminModule();
    getAdminApp();

    expect(certMock).toHaveBeenCalledWith(
      expect.objectContaining({
        privateKey: "-----BEGIN PRIVATE KEY-----\nline-one\nline-two\n-----END PRIVATE KEY-----\n",
      }),
    );
  });

  it("trims surrounding whitespace and a wrapping pair of quote characters from each credential field", async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = "  prod-project  ";
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = '"sa@prod-project.iam.gserviceaccount.com"';
    process.env.FIREBASE_ADMIN_PRIVATE_KEY =
      '"-----BEGIN PRIVATE KEY-----\\nline-one\\nline-two\\n-----END PRIVATE KEY-----\\n"\n';

    const { getAdminApp } = await importFreshAdminModule();
    getAdminApp();

    expect(certMock).toHaveBeenCalledWith({
      projectId: "prod-project",
      clientEmail: "sa@prod-project.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nline-one\nline-two\n-----END PRIVATE KEY-----\n",
    });
  });

  it("throws a clear diagnostic naming exactly the missing variables when only part of the credential set is present", async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = "prod-project";
    // FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY deliberately left unset.

    const { getAdminApp } = await importFreshAdminModule();

    expect(() => getAdminApp()).toThrow(/FIREBASE_ADMIN_CLIENT_EMAIL/);
    expect(() => getAdminApp()).toThrow(/FIREBASE_ADMIN_PRIVATE_KEY/);
    expect(certMock).not.toHaveBeenCalled();
    expect(applicationDefaultMock).not.toHaveBeenCalled();
    expect(initializeAppMock).not.toHaveBeenCalled();
  });

  it("falls back to applicationDefault() when none of the FIREBASE_ADMIN_* values are set", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "dev-project";

    const { getAdminApp } = await importFreshAdminModule();
    getAdminApp();

    expect(applicationDefaultMock).toHaveBeenCalledTimes(1);
    expect(certMock).not.toHaveBeenCalled();
    expect(initializeAppMock).toHaveBeenCalledWith(expect.objectContaining({ projectId: "dev-project" }));
  });

  it("initializes only once across repeated getAdminApp() calls (idempotent)", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "dev-project";

    const { getAdminApp } = await importFreshAdminModule();
    const first = getAdminApp();
    const second = getAdminApp();
    const third = getAdminApp();

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
  });

  it("does not require FIREBASE_ADMIN_* credentials against the Firebase Emulator Suite", async () => {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-96order";

    const { getAdminApp } = await importFreshAdminModule();
    getAdminApp();

    expect(certMock).not.toHaveBeenCalled();
    expect(applicationDefaultMock).not.toHaveBeenCalled();
    expect(initializeAppMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ credential: expect.anything() }),
    );
  });
});
