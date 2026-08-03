import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";
import type { PublicBrand, PublicCategory, PublicProduct } from "@/core/storefront/dto";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildProductMetadata(product: PublicProduct): Metadata {
  const title = product.seoTitle ?? `${product.name} | ${SITE_NAME}`;
  const description = product.seoDescription ?? product.shortDescription ?? `${product.name} — available at ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/products/${product.slug}`);
  const image = product.images.find((img) => img.isPrimary) ?? product.images[0];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
      images: image ? [{ url: image.url, alt: image.altText }] : undefined,
    },
    // Twitter/X doesn't fall back to `openGraph.images` — without this,
    // sharing a product link there would show the generic site-wide
    // `og-default.png` (inherited from the root layout's `twitter` block)
    // instead of the actual product photo Open Graph consumers already get.
    twitter: image ? { card: "summary_large_image", title, description, images: [image.url] } : undefined,
  };
}

export function buildCategoryMetadata(category: PublicCategory): Metadata {
  const title = category.seoTitle ?? `${category.name} | ${SITE_NAME}`;
  const description = category.seoDescription ?? category.description ?? `Shop ${category.name} at ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/categories/${category.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", siteName: SITE_NAME },
  };
}

export function buildBrandMetadata(brand: PublicBrand): Metadata {
  const title = brand.seoTitle ?? `${brand.name} | ${SITE_NAME}`;
  const description = brand.seoDescription ?? brand.description ?? `Shop ${brand.name} products at ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/brands/${brand.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", siteName: SITE_NAME },
  };
}

export function buildStaticPageMetadata(title: string, description: string, path: string): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: canonical, type: "website", siteName: SITE_NAME },
  };
}
