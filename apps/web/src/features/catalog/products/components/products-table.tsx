import Link from "next/link";
import type { Product } from "@/core/catalog/entities";
import { ArchiveProductButton } from "./archive-product-button";

export function ProductsTable({ products, canManage }: { products: Product[]; canManage: boolean }) {
  if (products.length === 0) {
    return <p className="text-sm text-foreground/60">No products yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {products.map((product) => (
        <li key={product.id} className="flex items-center justify-between gap-4 border-b border-brand-100 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{product.name}</span>
            <span className="text-xs text-foreground/50">
              SKU {product.sku} · {product.status} · {product.visibility}
              {product.hasVariants && ` · ${product.variants.length} variant(s)`}
            </span>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Link href={`/admin/products/${product.id}`} className="text-sm text-brand-700 hover:underline">
                Edit
              </Link>
              {product.status !== "archived" && <ArchiveProductButton productId={product.id} />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
