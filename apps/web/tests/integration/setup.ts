import { vi } from "vitest";

// See tests/unit/setup.ts for why this is needed outside Next's bundler.
vi.mock("server-only", () => ({}));
