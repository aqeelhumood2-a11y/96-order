import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/core/errors";
import { withUniqueSlug } from "@/services/catalog/unique-slug";

describe("withUniqueSlug", () => {
  it("derives a slug from the name and uses it on the first attempt", async () => {
    const attempt = vi.fn().mockResolvedValue("ok");
    const result = await withUniqueSlug("Coffee Beans", undefined, attempt);
    expect(result).toBe("ok");
    expect(attempt).toHaveBeenCalledExactlyOnceWith("coffee-beans");
  });

  it("uses an explicit slug without retrying, even on conflict", async () => {
    const attempt = vi.fn().mockRejectedValue(new ConflictError());
    await expect(withUniqueSlug("Coffee Beans", "custom-slug", attempt)).rejects.toThrow(ConflictError);
    expect(attempt).toHaveBeenCalledExactlyOnceWith("custom-slug");
  });

  it("retries with a suffixed slug when the derived slug collides", async () => {
    // Two differently-named products that both end in "250 g" collapse to
    // the same slug once slugify() strips every non-Latin/digit character —
    // exactly what happens with Arabic product names.
    const attempt = vi.fn().mockRejectedValueOnce(new ConflictError()).mockResolvedValueOnce("ok");
    const result = await withUniqueSlug("بلاك نايت | خوخ 250 ج", undefined, attempt);
    expect(result).toBe("ok");
    expect(attempt).toHaveBeenCalledTimes(2);
    expect(attempt).toHaveBeenNthCalledWith(1, "250");
    const secondSlug = attempt.mock.calls[1]![0] as string;
    expect(secondSlug).toMatch(/^250-[0-9a-f]{6}$/);
  });

  it("gives up after repeated collisions and surfaces the last error", async () => {
    const attempt = vi.fn().mockRejectedValue(new ConflictError());
    await expect(withUniqueSlug("250", undefined, attempt)).rejects.toThrow(ConflictError);
    expect(attempt).toHaveBeenCalledTimes(5);
  });

  it("does not retry a non-conflict error", async () => {
    const attempt = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(withUniqueSlug("Coffee Beans", undefined, attempt)).rejects.toThrow("boom");
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
