"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerAddress } from "@/core/customer-address/entities";
import { deleteAddressAction, setDefaultAddressAction } from "@/features/customer-addresses/actions";
import { AddressForm } from "@/features/customer-addresses/components/address-form";
import { Button } from "@/ui/primitives/button";

export function AddressesList({ addresses }: { addresses: CustomerAddress[] }) {
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
      {addresses.length === 0 && <p className="text-sm text-foreground/69">You haven&apos;t saved any addresses yet.</p>}

      {addresses.map((address) =>
        editingId === address.id ? (
          <AddressForm key={address.id} existing={address} onDone={() => setEditingId(null)} />
        ) : (
          <div key={address.id} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium capitalize text-brand-900">
                {address.label === "custom" ? address.customLabel : address.label}
                {address.isDefault && <span className="ml-2 rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-800">Default</span>}
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
                Edit
              </Button>
              {!address.isDefault && (
                <Button size="sm" variant="outline" disabled={busyId === address.id} onClick={() => handleSetDefault(address.id)}>
                  Set as default
                </Button>
              )}
              <Button size="sm" variant="destructive" disabled={busyId === address.id} onClick={() => handleDelete(address.id)}>
                Delete
              </Button>
            </div>
          </div>
        ),
      )}

      {showNewForm ? (
        <AddressForm onDone={() => setShowNewForm(false)} />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowNewForm(true)}>
          Add a new address
        </Button>
      )}
    </div>
  );
}
