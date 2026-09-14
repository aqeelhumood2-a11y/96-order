import { formatMoney, money } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { cn } from "@/lib/cn";

export interface PriceDisplayProps {
  /** Minor units (fils) — matches how `Product.basePrice` etc. are stored. */
  price: number;
  compareAtPrice?: number;
  className?: string;
  locale?: Locale;
}

export function PriceDisplay({ price, compareAtPrice, className, locale = DEFAULT_LOCALE }: PriceDisplayProps) {
  const dict = getDictionary(locale).storefront.listing;
  const isOnSale = compareAtPrice !== undefined && compareAtPrice > price;
  const formattedPrice = formatMoney(money(price));
  const formattedCompareAtPrice = compareAtPrice !== undefined ? formatMoney(money(compareAtPrice)) : undefined;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-brand-950">{formattedPrice}</span>
      {isOnSale && formattedCompareAtPrice && (
        <span className="text-sm text-foreground/65 line-through" aria-label={dict.compareAtPriceLabel.replace("{price}", formattedCompareAtPrice)}>
          {formattedCompareAtPrice}
        </span>
      )}
    </span>
  );
}
