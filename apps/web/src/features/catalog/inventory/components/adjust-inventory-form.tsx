"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INVENTORY_ADJUSTMENT_REASONS, type InventoryAdjustmentReason } from "@/core/catalog/entities";
import { adjustInventoryAction } from "@/features/catalog/inventory/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Select } from "@/ui/primitives/select";

export function AdjustInventoryForm({ productId, variantId }: { productId: string; variantId: string | null }) {
  const router = useRouter();
  const [reason, setReason] = useState<InventoryAdjustmentReason>("manual_adjustment");
  const [quantityDelta, setQuantityDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const delta = Number.parseInt(quantityDelta, 10);
    if (!Number.isInteger(delta) || delta === 0) {
      setError("Enter a non-zero whole number (negative to remove stock).");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adjustInventoryAction({
        productId,
        variantId,
        reason,
        quantityDelta: delta,
        note: note || undefined,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccessMessage(`Updated: on-hand is now ${result.data.onHand} (was ${result.data.onHandBefore}).`);
      setQuantityDelta("");
      setNote("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`reason-${productId}-${variantId ?? "-"}`}>Reason</Label>
        <Select
          id={`reason-${productId}-${variantId ?? "-"}`}
          value={reason}
          onChange={(event) => setReason(event.target.value as InventoryAdjustmentReason)}
          disabled={isSubmitting}
          className="w-44"
        >
          {INVENTORY_ADJUSTMENT_REASONS.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`delta-${productId}-${variantId ?? "-"}`}>Quantity change</Label>
        <Input
          id={`delta-${productId}-${variantId ?? "-"}`}
          type="number"
          value={quantityDelta}
          onChange={(event) => setQuantityDelta(event.target.value)}
          disabled={isSubmitting}
          className="w-28"
          placeholder="-5 or 10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`note-${productId}-${variantId ?? "-"}`}>Note (optional)</Label>
        <Input
          id={`note-${productId}-${variantId ?? "-"}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={isSubmitting}
          className="w-48"
        />
      </div>

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Applying…" : "Apply"}
      </Button>

      {error && (
        <p role="alert" className="w-full text-sm text-danger-600">
          {error}
        </p>
      )}
      {successMessage && (
        <p role="status" className="w-full text-sm text-foreground/70">
          {successMessage}
        </p>
      )}
    </form>
  );
}
