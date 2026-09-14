"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADDRESS_LABELS, type AddressLabel, type CustomerAddress } from "@/core/customer-address/entities";
import { createAddressAction, updateAddressAction } from "@/features/customer-addresses/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label, Select } from "@/ui/primitives";

export function AddressForm({ existing, onDone, locale = DEFAULT_LOCALE }: { existing?: CustomerAddress; onDone?: () => void; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.addresses;
  const router = useRouter();
  const [label, setLabel] = useState<AddressLabel>(existing?.label ?? "home");
  const [customLabel, setCustomLabel] = useState(existing?.customLabel ?? "");
  const [recipientName, setRecipientName] = useState(existing?.recipientName ?? "");
  const [recipientMobile, setRecipientMobile] = useState(existing?.recipientMobile ?? "");
  const [area, setArea] = useState(existing?.address.area ?? "");
  const [block, setBlock] = useState(existing?.address.block ?? "");
  const [road, setRoad] = useState(existing?.address.road ?? "");
  const [building, setBuilding] = useState(existing?.address.building ?? "");
  const [flat, setFlat] = useState(existing?.address.flat ?? "");
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        label,
        customLabel: label === "custom" ? customLabel : undefined,
        recipientName,
        recipientMobile,
        address: { country: "BH", area, block, road, building, flat: flat || undefined },
        isDefault,
      };
      const result = existing ? await updateAddressAction(existing.id, input) : await createAddressAction(input);
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
          <Label htmlFor="address-label">{dict.label}</Label>
          <Select id="address-label" value={label} onChange={(event) => setLabel(event.target.value as AddressLabel)} disabled={isSubmitting}>
            {ADDRESS_LABELS.map((value) => (
              <option key={value} value={value}>
                {dict.labelValues[value]}
              </option>
            ))}
          </Select>
        </div>
        {label === "custom" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-custom-label">{dict.customLabel}</Label>
            <Input id="address-custom-label" value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} disabled={isSubmitting} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-recipient">{dict.recipientName}</Label>
          <Input id="address-recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-mobile">{dict.mobile}</Label>
          <Input id="address-mobile" value={recipientMobile} onChange={(event) => setRecipientMobile(event.target.value)} disabled={isSubmitting} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-area">{dict.area}</Label>
          <Input id="address-area" value={area} onChange={(event) => setArea(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-block">{dict.block}</Label>
          <Input id="address-block" value={block} onChange={(event) => setBlock(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-road">{dict.road}</Label>
          <Input id="address-road" value={road} onChange={(event) => setRoad(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-building">{dict.building}</Label>
          <Input id="address-building" value={building} onChange={(event) => setBuilding(event.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-flat">{dict.flatOptional}</Label>
          <Input id="address-flat" value={flat} onChange={(event) => setFlat(event.target.value)} disabled={isSubmitting} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/80">
        <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} disabled={isSubmitting} />
        {dict.setAsDefaultCheckbox}
      </label>

      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? dict.saving : existing ? dict.saveChanges : dict.addAddress}
      </Button>
    </form>
  );
}
