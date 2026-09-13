import type { BestSellingProductRow } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function BestSellersTable({ products, locale = DEFAULT_LOCALE }: { products: BestSellingProductRow[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage;

  if (products.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.noSalesInRange}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.bestSellersTable.product}</th>
            <th className="px-4 py-3 font-medium">{dict.bestSellersTable.sku}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.bestSellersTable.qtySold}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.bestSellersTable.revenue}</th>
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
