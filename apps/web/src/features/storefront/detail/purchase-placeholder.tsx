import { Button } from "@/ui/primitives";

export interface PurchasePlaceholderProps {
  available: boolean;
}

/** No cart/checkout exists yet — this is a clearly-disabled placeholder, never a functioning purchase path. */
export function PurchasePlaceholder({ available }: PurchasePlaceholderProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button type="button" disabled aria-disabled="true" className="w-full sm:w-auto">
        Add to cart
      </Button>
      <p className="text-xs text-foreground/50">
        {available ? "Purchasing is coming in a future update." : "Select an available option to continue."}
      </p>
    </div>
  );
}
