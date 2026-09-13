"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Promotion } from "@/core/promotions/entities";
import type { PromotionInput } from "@/core/promotions/schemas";
import { DISCOUNT_TYPES } from "@/core/pricing/discount-engine";
import { createPromotionAction, updatePromotionAction } from "@/features/admin-promotions/actions";
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

export function PromotionForm({ existing, onDone, locale = DEFAULT_LOCALE }: { existing?: Promotion; onDone?: () => void; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.promotionForm;
  const discountTypeDict = getDictionary(locale).admin.discountType;
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<PromotionInput["type"]>(existing?.type ?? "percentage");
  const [value, setValue] = useState(existing?.value ?? 10);
  const [categoryIds, setCategoryIds] = useState(existing?.scope.categoryIds.join(", ") ?? "");
  const [brandIds, setBrandIds] = useState(existing?.scope.brandIds.join(", ") ?? "");
  const [startsAt, setStartsAt] = useState(toDateInputValue(existing?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInputValue(existing?.endsAt ?? null));
  const [active, setActive] = useState(existing?.active ?? true);
  const [priority, setPriority] = useState(existing?.priority ?? 100);
  const [stackable, setStackable] = useState(existing?.stackable ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const input: PromotionInput = {
        name,
        type,
        value,
        scope: { categoryIds: splitIds(categoryIds), brandIds: splitIds(brandIds) },
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        active,
        priority,
        stackable,
      };
      const result = existing ? await updatePromotionAction(existing.id, input) : await createPromotionAction(input);
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
          <Label>{dict.name}</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{dict.type}</Label>
          <Select value={type} onChange={(event) => setType(event.target.value as PromotionInput["type"])} disabled={isSubmitting}>
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
              <Label>{dict.startsAt}</Label>
              <Input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.endsAt}</Label>
              <Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{dict.priority}</Label>
              <Input type="number" value={priority} onChange={(event) => setPriority(Number(event.target.value))} disabled={isSubmitting} min={0} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={stackable} onChange={(event) => setStackable(event.target.checked)} disabled={isSubmitting} />
            {dict.stackable}
          </label>
        </div>
      </details>

      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}

      <Button type="submit" size="sm" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? dict.saving : existing ? dict.saveChanges : dict.createPromotion}
      </Button>
    </form>
  );
}
