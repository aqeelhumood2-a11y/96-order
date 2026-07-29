import { vi } from "vitest";

// See tests/unit/setup.ts for why this is needed outside Next's bundler.
vi.mock("server-only", () => ({}));

// next/server's after() requires an active request scope (an AsyncLocalStorage
// context Next's own server sets up per-request). These integration tests call
// exported Route Handlers directly, with no Next server in front of them, so
// that context never exists. Stubbing after() to invoke its callback immediately
// keeps request-password-reset.ts's real code path under test (including that
// the call happens, against the real Auth emulator) without needing a running
// Next server — see tests/unit/setup.ts for the identical rationale.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (callback: () => unknown) => {
      void callback();
    },
  };
});
