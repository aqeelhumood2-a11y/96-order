import { formatMoney, money } from "@/core/money/money";
import { cn } from "@/lib/cn";

export interface PriceDisplayProps {
  /** Minor units (fils) — matches how `Product.basePrice` etc. are stored. */
  price: number;
  compareAtPrice?: number;
  className?: string;
}

export function PriceDisplay({ price, compareAtPrice, className }: PriceDisplayProps) {
  const isOnSale = compareAtPrice !== undefined && compareAtPrice > price;
  const formattedPrice = formatMoney(money(price));
  const formattedCompareAtPrice = compareAtPrice !== undefined ? formatMoney(money(compareAtPrice)) : undefined;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-brand-950">{formattedPrice}</span>
      {isOnSale && formattedCompareAtPrice && (
        <span
          className="text-sm text-foreground/65 line-through"
          aria-label={`Compare at price ${formattedCompareAtPrice}`}
        >
          {formattedCompareAtPrice}
        </span>
      )}
    </span>
  );
}
