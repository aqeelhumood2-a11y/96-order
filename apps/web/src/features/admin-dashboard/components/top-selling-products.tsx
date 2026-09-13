import type { BestSellingProductRow } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function TopSellingProducts({ products, locale = DEFAULT_LOCALE }: { products: BestSellingProductRow[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.dashboardPage;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">{dict.topSellingProducts}</h2>
      {products.length === 0 ? (
        <p className="text-sm text-foreground/69">{dict.noSalesRecent}</p>
      ) : (
        <ol className="flex flex-col gap-1.5 text-sm">
          {products.map((product, index) => (
            <li key={`${product.productId}:${product.variantId ?? "-"}`} className="flex items-center justify-between gap-3">
              <span className="text-foreground/80">
                {index + 1}. {product.productName} <span className="text-foreground/65">({product.sku})</span>
              </span>
              <span className="text-foreground/69">{dict.soldSummary.replace("{qty}", String(product.quantitySold)).replace("{revenue}", formatMoney(product.revenue))}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
