"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Promotion } from "@/core/promotions/entities";
import type { PromotionInput } from "@/core/promotions/schemas";
import { DISCOUNT_TYPES } from "@/core/pricing/discount-engine";
import { createPromotionAction, updatePromotionAction } from "@/features/admin-promotions/actions";
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

export function PromotionForm({ existing, onDone }: { existing?: Promotion; onDone?: () => void }) {
  const router = useRouter();
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
          <Label>Name</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select value={type} onChange={(event) => setType(event.target.value as PromotionInput["type"])} disabled={isSubmitting}>
            {DISCOUNT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {type !== "free_shipping" && (
        <div className="flex flex-col gap-1.5">
          <Label>{type === "percentage" ? "Percentage (1-100)" : "Fixed amount (fils)"}</Label>
          <Input type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} disabled={isSubmitting} min={0} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Category ids (comma-separated, empty = store-wide)</Label>
          <Input value={categoryIds} onChange={(event) => setCategoryIds(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Brand ids (comma-separated)</Label>
          <Input value={brandIds} onChange={(event) => setBrandIds(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Starts at</Label>
          <Input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ends at</Label>
          <Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Priority (lower wins when non-stackable)</Label>
          <Input type="number" value={priority} onChange={(event) => setPriority(Number(event.target.value))} disabled={isSubmitting} min={0} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={isSubmitting} />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={stackable} onChange={(event) => setStackable(event.target.checked)} disabled={isSubmitting} />
          Stackable with other promotions
        </label>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <Button type="submit" size="sm" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Saving…" : existing ? "Save changes" : "Create promotion"}
      </Button>
    </form>
  );
}
