import { Badge } from "@/ui/primitives";
import type { PublicAvailability } from "@/core/storefront/dto";

export interface AvailabilityBadgeProps {
  availability: PublicAvailability;
  className?: string;
}

/** Screen-reader-friendly, human-worded availability — never a raw quantity. */
export function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  if (!availability.inStock) {
    return (
      <Badge variant="danger" className={className}>
        Out of stock
      </Badge>
    );
  }

  if (availability.lowStock) {
    return (
      <Badge variant="warning" className={className}>
        Low stock
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={className}>
      In stock
    </Badge>
  );
}
