import { describe, expect, it } from "vitest";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/core/storefront/structured-data";
import type { PublicProduct } from "@/core/storefront/dto";

function makeProduct(overrides: Partial<PublicProduct> = {}): PublicProduct {
  return {
    id: "product-1",
    slug: "ethiopia-yirgacheffe",
    name: "Ethiopia Yirgacheffe",
    brand: { name: "Acme Roasters", slug: "acme-roasters" },
    primaryCategory: { name: "Coffee", slug: "coffee" },
    additionalCategories: [],
    productType: "coffee",
    tags: [],
    featured: false,
    sku: "ETH-YIRG-250",
    basePrice: 1899,
    images: [],
    hasVariants: false,
    variants: [],
    availability: { inStock: true, lowStock: false },
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("buildBreadcrumbJsonLd", () => {
  it("builds a schema.org BreadcrumbList with 1-based positions", () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://example.com/" },
      { name: "Coffee", url: "https://example.com/categories/coffee" },
    ]);

    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://example.com/" },
        { "@type": "ListItem", position: 2, name: "Coffee", item: "https://example.com/categories/coffee" },
      ],
    });
  });
});

describe("buildProductJsonLd", () => {
  it("builds a schema.org Product with an Offer reflecting price and availability", () => {
    const product = makeProduct();
    const jsonLd = buildProductJsonLd(product, "https://example.com/products/ethiopia-yirgacheffe");

    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Ethiopia Yirgacheffe",
      sku: "ETH-YIRG-250",
      brand: { "@type": "Brand", name: "Acme Roasters" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "18.99",
        availability: "https://schema.org/InStock",
        url: "https://example.com/products/ethiopia-yirgacheffe",
      },
    });
  });

  it("reflects out-of-stock availability", () => {
    const product = makeProduct({ availability: { inStock: false, lowStock: false } });
    const jsonLd = buildProductJsonLd(product, "https://example.com/products/ethiopia-yirgacheffe");
    expect((jsonLd.offers as Record<string, unknown>).availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits brand entirely when the product has none", () => {
    const product = makeProduct({ brand: null });
    const jsonLd = buildProductJsonLd(product, "https://example.com/products/ethiopia-yirgacheffe");
    expect(jsonLd).not.toHaveProperty("brand");
  });

  it("includes the primary image when present", () => {
    const product = makeProduct({
      images: [
        { url: "https://example.com/a.jpg", altText: "A", isPrimary: false, sortOrder: 1 },
        { url: "https://example.com/b.jpg", altText: "B", isPrimary: true, sortOrder: 0 },
      ],
    });
    const jsonLd = buildProductJsonLd(product, "https://example.com/products/ethiopia-yirgacheffe");
    expect(jsonLd.image).toEqual(["https://example.com/b.jpg"]);
  });
});
