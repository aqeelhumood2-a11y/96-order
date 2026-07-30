import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { listActiveCategories } from "@/services/storefront/get-category";
import { listActiveBrands } from "@/services/storefront/get-brand";
import { listProducts } from "@/services/storefront/list-products";

const SITEMAP_CATEGORY_LIMIT = 200;
const SITEMAP_BRAND_LIMIT = 200;
/** `listProductsQuerySchema` caps `limit` at 60 — see README's Known limitations for why this sitemap covers only the most recent page of products rather than the full catalog. */
const SITEMAP_PRODUCT_LIMIT = 60;

/** Reads Firestore, so it can't be statically generated at build time — see `app/(storefront)/page.tsx`'s doc comment. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, brands, productsPage] = await Promise.all([
    listActiveCategories(SITEMAP_CATEGORY_LIMIT),
    listActiveBrands(SITEMAP_BRAND_LIMIT),
    listProducts({ sort: "newest", limit: SITEMAP_PRODUCT_LIMIT }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${SITE_URL}/brands/${brand.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = productsPage.items.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: product.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...brandEntries, ...productEntries];
}
