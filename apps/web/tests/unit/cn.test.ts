import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("resolves conflicting Tailwind utilities in favor of the later one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
