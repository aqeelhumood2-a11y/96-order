"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricedCartLine } from "@/core/cart/rules";
import { formatMoney } from "@/core/money/money";
import { removeCartLineAction, updateCartLineAction } from "@/features/cart/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function CartLineRow({ line, locale = DEFAULT_LOCALE }: { line: PricedCartLine; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).storefront.cart;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapshot = line.snapshot;

  async function updateQuantity(quantity: number) {
    setPending(true);
    setError(null);
    const result = await updateCartLineAction(line.line.id, quantity);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  async function remove() {
    setPending(true);
    setError(null);
    const result = await removeCartLineAction(line.line.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-brand-100 py-4 last:border-b-0">
      <div className="min-w-40 flex-1">
        <p className="font-medium text-brand-950">{snapshot?.name ?? dict.unavailableItemName}</p>
        {snapshot?.variantAttributes && (
          <p className="text-xs text-foreground/65">
            {Object.entries(snapshot.variantAttributes)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ")}
          </p>
        )}
        {line.issues.length > 0 && (
          <p role="alert" className="mt-1 text-xs text-danger-600">
            {line.issues.includes("product_unavailable") && dict.itemNoLongerAvailable}
            {line.issues.includes("out_of_stock") && dict.itemOutOfStock}
            {line.issues.includes("quantity_reduced") && dict.quantityReduced.replace("{qty}", String(line.effectiveQuantity))}
          </p>
        )}
      </div>
      <input
        type="number"
        min={1}
        max={99}
        defaultValue={line.line.quantity}
        onBlur={(event) => updateQuantity(Number(event.target.value) || 1)}
        disabled={pending}
        aria-label={dict.quantityFor.replace("{name}", snapshot?.name ?? "item")}
        className="h-9 w-16 rounded-md border border-brand-300 bg-background px-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
      <p className="w-24 text-right text-sm font-medium text-brand-950">{formatMoney(line.lineTotal)}</p>
      <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={pending}>
        {dict.remove}
      </Button>
      {error && (
        <p role="alert" className="w-full text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
