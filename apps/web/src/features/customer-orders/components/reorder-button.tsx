"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reorderAction } from "@/features/customer-orders/actions";
import { Button } from "@/ui/primitives/button";

export function ReorderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await reorderAction(orderNumber);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(
        result.data.skippedCount > 0
          ? `Added ${result.data.addedCount} item(s) to your cart (${result.data.skippedCount} no longer available).`
          : `Added ${result.data.addedCount} item(s) to your cart.`,
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? "Adding to cart…" : "Reorder"}
      </Button>
      {message && (
        <p role="status" className="text-xs text-foreground/70">
          {message}
        </p>
      )}
    </div>
  );
}
