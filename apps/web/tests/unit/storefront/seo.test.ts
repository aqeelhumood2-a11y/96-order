import { describe, expect, it } from "vitest";
import { absoluteUrl, buildBrandMetadata, buildCategoryMetadata, buildProductMetadata, buildStaticPageMetadata } from "@/services/storefront/seo";
import type { PublicBrand, PublicCategory, PublicProduct } from "@/core/storefront/dto";

describe("absoluteUrl", () => {
  it("joins the site origin with a path", () => {
    expect(absoluteUrl("/products/foo")).toBe("http://localhost:3000/products/foo");
  });

  it("normalizes a path missing its leading slash", () => {
    expect(absoluteUrl("products/foo")).toBe("http://localhost:3000/products/foo");
  });
});

describe("buildProductMetadata", () => {
  const product: PublicProduct = {
    id: "product-1",
    slug: "ethiopia-yirgacheffe",
    name: "Ethiopia Yirgacheffe",
    shortDescription: "A bright, floral coffee.",
    brand: null,
    primaryCategory: { name: "Coffee", slug: "coffee" },
    additionalCategories: [],
    productType: "coffee",
    tags: [],
    featured: false,
    sku: "ETH-1",
    basePrice: 1899,
    images: [{ url: "https://example.com/a.jpg", altText: "Bag of coffee", isPrimary: true, sortOrder: 0 }],
    hasVariants: false,
    variants: [],
    availability: { inStock: true, lowStock: false },
    createdAt: new Date(),
  };

  it("falls back to name/shortDescription when seoTitle/seoDescription are absent", () => {
    const metadata = buildProductMetadata(product);
    expect(metadata.title).toBe("Ethiopia Yirgacheffe | Ninety Six Degrees Cafe");
    expect(metadata.description).toBe("A bright, floral coffee.");
  });

  it("prefers explicit seoTitle/seoDescription when present", () => {
    const metadata = buildProductMetadata({ ...product, seoTitle: "Custom title", seoDescription: "Custom description" });
    expect(metadata.title).toBe("Custom title");
    expect(metadata.description).toBe("Custom description");
  });

  it("sets a canonical URL matching the product's own slug", () => {
    const metadata = buildProductMetadata(product);
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/products/ethiopia-yirgacheffe");
  });

  it("includes the primary image in Open Graph data", () => {
    const metadata = buildProductMetadata(product);
    expect(metadata.openGraph?.images).toEqual([{ url: "https://example.com/a.jpg", alt: "Bag of coffee" }]);
  });

  it("sets a matching Twitter summary_large_image card, since Twitter doesn't fall back to Open Graph images", () => {
    const metadata = buildProductMetadata(product);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: ["https://example.com/a.jpg"] });
  });

  it("omits the Twitter card entirely when the product has no image, inheriting the site-wide default", () => {
    const metadata = buildProductMetadata({ ...product, images: [] });
    expect(metadata.twitter).toBeUndefined();
  });
});

describe("buildCategoryMetadata", () => {
  it("builds a canonical URL and title from the category", () => {
    const category: PublicCategory = { id: "cat-1", slug: "coffee", name: "Coffee", parent: null };
    const metadata = buildCategoryMetadata(category);
    expect(metadata.title).toBe("Coffee | Ninety Six Degrees Cafe");
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/categories/coffee");
  });
});

describe("buildBrandMetadata", () => {
  it("builds a canonical URL and title from the brand", () => {
    const brand: PublicBrand = { id: "brand-1", slug: "acme", name: "Acme" };
    const metadata = buildBrandMetadata(brand);
    expect(metadata.title).toBe("Acme | Ninety Six Degrees Cafe");
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/brands/acme");
  });
});

describe("buildStaticPageMetadata", () => {
  it("builds title/description/canonical for a static page", () => {
    const metadata = buildStaticPageMetadata("Search", "Search the catalog.", "/search");
    expect(metadata.title).toBe("Search | Ninety Six Degrees Cafe");
    expect(metadata.description).toBe("Search the catalog.");
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/search");
  });
});
