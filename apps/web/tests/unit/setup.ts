import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// The `server-only` package throws unconditionally unless resolved under
// Next's "react-server" bundler condition (which Vitest doesn't set). Unit
// tests import service/infrastructure modules directly (not through Next's
// bundler), so this stands in for that condition here.
vi.mock("server-only", () => ({}));
