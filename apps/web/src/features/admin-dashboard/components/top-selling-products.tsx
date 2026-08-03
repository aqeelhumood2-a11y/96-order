import type { BestSellingProductRow } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";

export function TopSellingProducts({ products }: { products: BestSellingProductRow[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">Top selling products (last 30 days)</h2>
      {products.length === 0 ? (
        <p className="text-sm text-foreground/60">No sales in the last 30 days yet.</p>
      ) : (
        <ol className="flex flex-col gap-1.5 text-sm">
          {products.map((product, index) => (
            <li key={`${product.productId}:${product.variantId ?? "-"}`} className="flex items-center justify-between gap-3">
              <span className="text-foreground/80">
                {index + 1}. {product.productName} <span className="text-foreground/50">({product.sku})</span>
              </span>
              <span className="text-foreground/60">
                {product.quantitySold} sold · {formatMoney(product.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
