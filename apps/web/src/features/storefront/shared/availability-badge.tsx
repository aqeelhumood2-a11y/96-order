import { Badge } from "@/ui/primitives";
import type { PublicAvailability } from "@/core/storefront/dto";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface AvailabilityBadgeProps {
  availability: PublicAvailability;
  className?: string;
  locale?: Locale;
}

/** Screen-reader-friendly, human-worded availability — never a raw quantity. */
export function AvailabilityBadge({ availability, className, locale = DEFAULT_LOCALE }: AvailabilityBadgeProps) {
  const dict = getDictionary(locale);

  if (!availability.inStock) {
    return (
      <Badge variant="danger" className={className}>
        {dict.product.outOfStock}
      </Badge>
    );
  }

  if (availability.lowStock) {
    return (
      <Badge variant="warning" className={className}>
        {dict.storefront.listing.lowStock}
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={className}>
      {dict.product.inStock}
    </Badge>
  );
}
