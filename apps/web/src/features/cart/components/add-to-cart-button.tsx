"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/features/cart/actions";
import { Button } from "@/ui/primitives/button";

export interface AddToCartButtonProps {
  productId: string;
  variantId: string | null;
  disabled?: boolean;
  disabledReason?: string;
}

export function AddToCartButton({ productId, variantId, disabled, disabledReason }: AddToCartButtonProps) {
  const router = useRouter();
  const quantityId = useId();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setStatus("loading");
    setError(null);
    const result = await addToCartAction(productId, variantId, quantity);
    if (!result.ok) {
      setStatus("error");
      setError(result.message);
      return;
    }
    setStatus("success");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor={quantityId}>
          Quantity
        </label>
        <input
          id={quantityId}
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(event) => setQuantity(Math.min(99, Math.max(1, Number(event.target.value) || 1)))}
          disabled={disabled || status === "loading"}
          className="h-10 w-20 rounded-md border border-brand-300 bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="button" onClick={handleAdd} disabled={disabled || status === "loading"} className="flex-1 sm:flex-none">
          {status === "loading" ? "Adding…" : "Add to cart"}
        </Button>
      </div>
      {disabled && disabledReason && <p className="text-xs text-foreground/65">{disabledReason}</p>}
      {status === "success" && (
        <p role="status" className="text-xs text-brand-700">
          Added to cart.
        </p>
      )}
      {status === "error" && error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
