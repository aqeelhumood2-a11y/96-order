import { describe, expect, it, vi } from "vitest";

const unstable_cache = vi.fn((fn: (...args: unknown[]) => unknown) => fn);
const revalidateTag = vi.fn();

vi.mock("next/cache", () => ({ unstable_cache, revalidateTag }));

describe("withStorefrontCache", () => {
  it("wraps the function with the given key prefix, tags, and the shared revalidate window", async () => {
    const { withStorefrontCache, STOREFRONT_CACHE_REVALIDATE_SECONDS } = await import("@/services/storefront/cache");
    const fn = async (x: number) => x * 2;

    withStorefrontCache("storefront:test", ["storefront:products"], fn);

    expect(unstable_cache).toHaveBeenCalledWith(fn, ["storefront:test"], {
      tags: ["storefront:products"],
      revalidate: STOREFRONT_CACHE_REVALIDATE_SECONDS,
    });
  });
});

describe("revalidateStorefrontTag", () => {
  it("calls next/cache's revalidateTag with the 'max' profile", async () => {
    const { revalidateStorefrontTag, STOREFRONT_CACHE_TAGS } = await import("@/services/storefront/cache");

    revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.products);

    expect(revalidateTag).toHaveBeenCalledWith(STOREFRONT_CACHE_TAGS.products, "max");
  });
});
