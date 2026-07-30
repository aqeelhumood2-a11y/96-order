import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  className?: string;
}

export function PriceDisplay({ price, compareAtPrice, className }: PriceDisplayProps) {
  const isOnSale = compareAtPrice !== undefined && compareAtPrice > price;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-brand-950">{formatPrice(price)}</span>
      {isOnSale && (
        <span
          className="text-sm text-foreground/50 line-through"
          aria-label={`Compare at price ${formatPrice(compareAtPrice)}`}
        >
          {formatPrice(compareAtPrice)}
        </span>
      )}
    </span>
  );
}
