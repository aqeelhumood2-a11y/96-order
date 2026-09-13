"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/core/coupons/entities";
import type { CouponInput } from "@/core/coupons/schemas";
import { DISCOUNT_TYPES } from "@/core/pricing/discount-engine";
import { createCouponAction, updateCouponAction } from "@/features/admin-coupons/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label, Select } from "@/ui/primitives";

function splitIds(value: string): string[] {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function CouponForm({ existing, onDone, locale = DEFAULT_LOCALE }: { existing?: Coupon; onDone?: () => void; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.couponForm;
  const discountTypeDict = getDictionary(locale).admin.discountType;
  const codeId = useId();
  const [code, setCode] = useState(existing?.code ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [type, setType] = useState<CouponInput["type"]>(existing?.type ?? "percentage");
  const [value, setValue] = useState(existing?.value ?? 10);
  const [categoryIds, setCategoryIds] = useState(existing?.scope.categoryIds.join(", ") ?? "");
  const [brandIds, setBrandIds] = useState(existing?.scope.brandIds.join(", ") ?? "");
  const [excludedProductIds, setExcludedProductIds] = useState(existing?.excludedProductIds.join(", ") ?? "");
  const [excludedCategoryIds, setExcludedCategoryIds] = useState(existing?.excludedCategoryIds.join(", ") ?? "");
  const [minSubtotal, setMinSubtotal] = useState(existing?.minSubtotal?.amount ?? 0);
  const [maxDiscountCap, setMaxDiscountCap] = useState(existing?.maxDiscountCap?.amount ?? 0);
  const [startsAt, setStartsAt] = useState(toDateInputValue(existing?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInputValue(existing?.endsAt ?? null));
  const [active, setActive] = useState(existing?.active ?? true);
  const [usageLimit, setUsageLimit] = useState(existing?.usageLimit ?? 0);
  const [perCustomerLimit, setPerCustomerLimit] = useState(existing?.perCustomerLimit ?? 0);
  const [firstOrderOnly, setFirstOrderOnly] = useState(existing?.firstOrderOnly ?? false);
  const [stackable, setStackable] = useState(existing?.stackable ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const input: CouponInput = {
        code,
        description,
        type,
        value,
        scope: { categoryIds: splitIds(categoryIds), brandIds: splitIds(brandIds) },
        excludedProductIds: splitIds(excludedProductIds),
        excludedCategoryIds: splitIds(excludedCategoryIds),
        minSubtotal: minSubtotal > 0 ? minSubtotal : null,
        maxDiscountCap: maxDiscountCap > 0 ? maxDiscountCap : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        active,
        usageLimit: usageLimit > 0 ? usageLimit : null,
        perCustomerLimit: perCustomerLimit > 0 ? perCustomerLimit : null,
        firstOrderOnly,
        stackable,
      };
      const result = existing ? await updateCouponAction(existing.code, input) : await createCouponAction(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
      onDone?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 rounded-md border border-brand-100 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={codeId}>{dict.code}</Label>
          <Input id={codeId} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} disabled={isSubmitting || !!existing} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{dict.type}</Label>
          <Select value={type} onChange={(event) => setType(event.target.value as CouponInput["type"])} disabled={isSubmitting}>
            {DISCOUNT_TYPES.map((value) => (
              <option key={value} value={value}>
                {discountTypeDict[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {type !== "free_shipping" && (
        <div className="flex flex-col gap-1.5">
          <Label>{type === "percentage" ? dict.percentageValue : dict.fixedValue}</Label>
          <Input type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} disabled={isSubmitting} min={0} />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-foreground/80">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={isSubmitting} />
        {dict.active}
      </label>

      <details className="group rounded-md border border-surface-border p-3">
        <summary className="cursor-pointer text-sm font-medium text-brand-800 select-none">{dict.advancedOptions}</summary>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{dict.description}</Label>
            <Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{dict.categoryIds}</Label>
              <Input value={categoryIds} onChange={(event) => setCategoryIds(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.brandIds}</Label>
              <Input value={brandIds} onChange={(event) => setBrandIds(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.excludedProductIds}</Label>
              <Input value={excludedProductIds} onChange={(event) => setExcludedProductIds(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.excludedCategoryIds}</Label>
              <Input value={excludedCategoryIds} onChange={(event) => setExcludedCategoryIds(event.target.value)} disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{dict.minSubtotal}</Label>
              <Input type="number" value={minSubtotal} onChange={(event) => setMinSubtotal(Number(event.target.value))} disabled={isSubmitting} min={0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.maxDiscountCap}</Label>
              <Input type="number" value={maxDiscountCap} onChange={(event) => setMaxDiscountCap(Number(event.target.value))} disabled={isSubmitting} min={0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.usageLimit}</Label>
              <Input type="number" value={usageLimit} onChange={(event) => setUsageLimit(Number(event.target.value))} disabled={isSubmitting} min={0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.perCustomerLimit}</Label>
              <Input type="number" value={perCustomerLimit} onChange={(event) => setPerCustomerLimit(Number(event.target.value))} disabled={isSubmitting} min={0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.startsAt}</Label>
              <Input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.endsAt}</Label>
              <Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} disabled={isSubmitting} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" checked={firstOrderOnly} onChange={(event) => setFirstOrderOnly(event.target.checked)} disabled={isSubmitting} />
              {dict.firstOrderOnly}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" checked={stackable} onChange={(event) => setStackable(event.target.checked)} disabled={isSubmitting} />
              {dict.stackable}
            </label>
          </div>
        </div>
      </details>

      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}

      <Button type="submit" size="sm" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? dict.saving : existing ? dict.saveChanges : dict.createCoupon}
      </Button>
    </form>
  );
}
