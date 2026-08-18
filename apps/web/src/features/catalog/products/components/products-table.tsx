import Link from "next/link";
import type { Product } from "@/core/catalog/entities";
import { Badge } from "@/ui/primitives/badge";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { ArchiveProductButton } from "./archive-product-button";

const STATUS_BADGE_VARIANT = { draft: "neutral", active: "success", archived: "danger" } as const;
const VISIBILITY_BADGE_VARIANT = { visible: "accent", hidden: "neutral" } as const;

export function ProductsTable({ products, canManage, locale = DEFAULT_LOCALE }: { products: Product[]; canManage: boolean; locale?: Locale }) {
  const dict = getDictionary(locale).admin.productsPage;

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border p-10 text-center">
        <p className="text-sm font-medium text-brand-950">{dict.noProducts}</p>
        <p className="mt-1 text-sm text-foreground/69">{dict.noProductsHint}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-surface-border overflow-hidden rounded-lg border border-surface-border">
      {products.map((product) => (
        <li key={product.id} className="flex items-center justify-between gap-4 bg-background p-4 transition-colors hover:bg-surface-sunken">
          <Link href={`/admin/products/${product.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-foreground/65">
              <span>SKU {product.sku}</span>
              <Badge variant={STATUS_BADGE_VARIANT[product.status]}>{product.status}</Badge>
              <Badge variant={VISIBILITY_BADGE_VARIANT[product.visibility]}>{product.visibility}</Badge>
              {product.hasVariants && <span>{product.variants.length} variant(s)</span>}
            </span>
          </Link>
          {canManage && (
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/admin/products/${product.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                {dict.edit}
              </Link>
              {product.status !== "archived" && <ArchiveProductButton productId={product.id} />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
