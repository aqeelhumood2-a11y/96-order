import type { BestSellingProductRow } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";

export function BestSellersTable({ products }: { products: BestSellingProductRow[] }) {
  if (products.length === 0) {
    return <p className="text-sm text-foreground/69">No sales in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 text-right font-medium">Qty sold</th>
            <th className="px-4 py-3 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={`${product.productId}:${product.variantId ?? "-"}`} className="border-b border-brand-50 last:border-0">
              <td className="px-4 py-3 text-foreground">{product.productName}</td>
              <td className="px-4 py-3 text-foreground/69">{product.sku}</td>
              <td className="px-4 py-3 text-right">{product.quantitySold}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(product.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
