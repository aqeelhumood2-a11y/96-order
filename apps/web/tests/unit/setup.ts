import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// The `server-only` package throws unconditionally unless resolved under
// Next's "react-server" bundler condition (which Vitest doesn't set). Unit
// tests import service/infrastructure modules directly (not through Next's
// bundler), so this stands in for that condition here.
vi.mock("server-only", () => ({}));

// next/server's after() requires an active request scope, which doesn't
// exist in a plain Vitest run. Stubbing it to just invoke the callback
// immediately keeps request-password-reset.ts's real code path under test
// (including that the call happens) without needing a running Next server.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (callback: () => unknown) => {
      void callback();
    },
  };
});
