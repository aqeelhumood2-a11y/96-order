import type { PublicProduct } from "./dto";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Pure JSON-LD builders — framework-agnostic plain objects, rendered by whatever page needs them via `StructuredData`. `canonicalUrl`/breadcrumb URLs are injected by the caller since `core` cannot depend on site configuration. */
export function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Reflects the product's own base price and aggregate availability, not a
 * client-selected variant — this is generated once per page load from the
 * resolved page data, not re-rendered as a shopper changes variant
 * selections.
 */
export function buildProductJsonLd(product: PublicProduct, canonicalUrl: string): Record<string, unknown> {
  const image = product.images.find((img) => img.isPrimary) ?? product.images[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription ?? product.shortDescription ?? product.fullDescription,
    sku: product.sku,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(image ? { image: [image.url] } : {}),
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.basePrice / MINOR_UNITS_PER_MAJOR).toFixed(2),
      availability: product.availability.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl,
    },
  };
}
