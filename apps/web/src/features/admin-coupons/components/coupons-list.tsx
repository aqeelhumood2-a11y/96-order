"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/core/coupons/entities";
import { formatMoney } from "@/core/money/money";
import { setCouponActiveAction } from "@/features/admin-coupons/actions";
import { CouponForm } from "@/features/admin-coupons/components/coupon-form";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

export function CouponsList({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  async function handleToggleActive(coupon: Coupon) {
    setBusyCode(coupon.code);
    try {
      await setCouponActiveAction(coupon.code, !coupon.active);
      router.refresh();
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {coupons.map((coupon) =>
        editingCode === coupon.code ? (
          <CouponForm key={coupon.code} existing={coupon} onDone={() => setEditingCode(null)} />
        ) : (
          <div key={coupon.code} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-medium text-brand-950">{coupon.code}</span>
              <Badge variant={coupon.active ? "success" : "neutral"}>{coupon.active ? "active" : "inactive"}</Badge>
            </div>
            <p className="text-sm text-foreground/70">{coupon.description || "—"}</p>
            <p className="text-xs text-foreground/50">
              {coupon.type === "percentage" ? `${coupon.value}% off` : coupon.type === "fixed" ? `${formatMoney({ amount: coupon.value, currency: "BHD" })} off` : "Free shipping"} ·
              used {coupon.usageCount}
              {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingCode(coupon.code)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" disabled={busyCode === coupon.code} onClick={() => handleToggleActive(coupon)}>
                {coupon.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ),
      )}

      {showNewForm ? (
        <CouponForm onDone={() => setShowNewForm(false)} />
      ) : (
        <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowNewForm(true)}>
          New coupon
        </Button>
      )}
    </div>
  );
}
