"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerAddress } from "@/core/customer-address/entities";
import { deleteAddressAction, setDefaultAddressAction } from "@/features/customer-addresses/actions";
import { AddressForm } from "@/features/customer-addresses/components/address-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function AddressesList({ addresses, locale = DEFAULT_LOCALE }: { addresses: CustomerAddress[]; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.addresses;
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteAddressAction(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setBusyId(id);
    try {
      await setDefaultAddressAction(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && <p className="text-sm text-foreground/69">{dict.noAddresses}</p>}

      {addresses.map((address) =>
        editingId === address.id ? (
          <AddressForm key={address.id} existing={address} onDone={() => setEditingId(null)} locale={locale} />
        ) : (
          <div key={address.id} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-brand-900">
                {address.label === "custom" ? address.customLabel : dict.labelValues[address.label]}
                {address.isDefault && <span className="ml-2 rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-800">{dict.defaultBadge}</span>}
              </p>
            </div>
            <p className="text-sm text-foreground/70">
              {address.recipientName} · {address.recipientMobile}
            </p>
            <p className="text-sm text-foreground/70">
              {address.address.building}, Road {address.address.road}, Block {address.address.block}, {address.address.area}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingId(address.id)}>
                {dict.edit}
              </Button>
              {!address.isDefault && (
                <Button size="sm" variant="outline" disabled={busyId === address.id} onClick={() => handleSetDefault(address.id)}>
                  {dict.setAsDefault}
                </Button>
              )}
              <Button size="sm" variant="destructive" disabled={busyId === address.id} onClick={() => handleDelete(address.id)}>
                {dict.delete}
              </Button>
            </div>
          </div>
        ),
      )}

      {showNewForm ? (
        <AddressForm onDone={() => setShowNewForm(false)} locale={locale} />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowNewForm(true)}>
          {dict.addNewAddress}
        </Button>
      )}
    </div>
  );
}
