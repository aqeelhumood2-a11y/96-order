import type { Metadata } from "next";
import { searchQuerySchema } from "@/core/storefront/schemas";
import { searchProducts } from "@/services/storefront/search-products";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { SearchPage } from "@/features/storefront/search/search-page";
import { firstValue } from "@/features/storefront/listing/parse-search-params";

export const metadata: Metadata = buildStaticPageMetadata("Search", "Search our catalog of coffee and brewing equipment.", "/search");

/** See `app/(storefront)/page.tsx`'s doc comment — this page reads Firestore, so it can't be statically prerendered at build time. */
export const dynamic = "force-dynamic";

interface SearchRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchRoute({ searchParams }: SearchRouteProps) {
  const raw = await searchParams;
  const q = firstValue(raw.q) ?? "";
  const cursor = firstValue(raw.cursor);

  const result = searchQuerySchema.safeParse({ q, cursor });

  if (!result.success) {
    return <SearchPage query={q} products={[]} nextCursor={null} />;
  }

  const { items, nextCursor } = await searchProducts(result.data);

  return <SearchPage query={q} products={items} nextCursor={nextCursor} cursor={cursor} cursorsParam={firstValue(raw.cursors)} />;
}
