"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppliedDiscount } from "@/core/pricing/apply-discounts";
import { applyCouponAction, removeCouponAction } from "@/features/cart/actions";
import { Button, Input } from "@/ui/primitives";

export function CouponForm({ appliedCoupon }: { appliedCoupon: AppliedDiscount | null }) {
  const router = useRouter();
  const codeId = useId();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    const result = await applyCouponAction(code);
    setStatus("idle");
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCode("");
    router.refresh();
  }

  async function handleRemove() {
    setStatus("submitting");
    await removeCouponAction();
    setStatus("idle");
    router.refresh();
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-brand-800">Coupon {appliedCoupon.id} applied</span>
        <Button type="button" size="sm" variant="outline" disabled={status === "submitting"} onClick={handleRemove}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} noValidate className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor={codeId} className="sr-only">
          Coupon code
        </label>
        <Input id={codeId} value={code} onChange={(event) => setCode(event.target.value)} disabled={status === "submitting"} placeholder="Coupon code" className="flex-1" />
        <Button type="submit" size="sm" variant="outline" disabled={status === "submitting" || code.trim().length === 0}>
          Apply
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </form>
  );
}
