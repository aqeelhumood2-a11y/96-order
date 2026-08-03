"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentProviderSettings } from "@/core/site-settings/entities";
import type { AvailableSlot } from "@/core/scheduling/rules";
import { submitCheckoutAction } from "@/features/checkout/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Select } from "@/ui/primitives/select";
import { Textarea } from "@/ui/primitives/textarea";

export interface CheckoutFormProps {
  availableSlots: AvailableSlot[];
  pickupLocationName: string;
  pickupLocationAddress: string;
  paymentProviders: PaymentProviderSettings;
}

type FulfillmentMethod = "delivery" | "pickup";
type PaymentMethod = "cash" | "tap";

function formatSlotLabel(slot: AvailableSlot): string {
  return `${slot.date} · ${slot.timeWindow}`;
}

/** Whether the cash option applies for the currently chosen fulfillment method — mirrors `core/site-settings/entities.ts#isPaymentMethodEnabled`'s cash branch. */
function cashEnabledFor(fulfillmentMethod: FulfillmentMethod, paymentProviders: PaymentProviderSettings): boolean {
  return fulfillmentMethod === "delivery" ? paymentProviders.cashOnDeliveryEnabled : paymentProviders.cashOnPickupEnabled;
}

export function CheckoutForm({ availableSlots, pickupLocationName, pickupLocationAddress, paymentProviders }: CheckoutFormProps) {
  const router = useRouter();
  const formId = useId();
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(cashEnabledFor("delivery", paymentProviders) ? "cash" : "tap");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cashEnabled = cashEnabledFor(fulfillmentMethod, paymentProviders);
  const tapEnabled = paymentProviders.tapEnabled;

  // Switching delivery <-> pickup can make the currently selected payment
  // method unavailable (e.g. cash on pickup is off but cash on delivery
  // isn't) — resolved right where fulfillment changes, not via an effect,
  // so there's no extra render and no method the admin turned off can ever
  // be silently submitted.
  function handleFulfillmentChange(next: FulfillmentMethod) {
    setFulfillmentMethod(next);
    const nextCashEnabled = cashEnabledFor(next, paymentProviders);
    if (paymentMethod === "cash" && !nextCashEnabled && tapEnabled) {
      setPaymentMethod("tap");
    } else if (paymentMethod === "tap" && !tapEnabled && nextCashEnabled) {
      setPaymentMethod("cash");
    }
  }

  const firstAvailableSlot = availableSlots.find((slot) => slot.available);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const [date, timeWindow] = String(form.get("slot") ?? "").split("|");

    const result = await submitCheckoutAction({
      idempotencyKey: idempotencyKeyRef.current,
      customer: {
        fullName: String(form.get("fullName") ?? ""),
        mobile: String(form.get("mobile") ?? ""),
        email: String(form.get("email") ?? ""),
        companyName: String(form.get("companyName") ?? "") || undefined,
        note: String(form.get("note") ?? "") || undefined,
      },
      fulfillmentMethod,
      deliveryAddress:
        fulfillmentMethod === "delivery"
          ? {
              country: "BH",
              area: String(form.get("area") ?? ""),
              block: String(form.get("block") ?? ""),
              road: String(form.get("road") ?? ""),
              building: String(form.get("building") ?? ""),
              flat: String(form.get("flat") ?? "") || undefined,
              landmark: String(form.get("landmark") ?? "") || undefined,
              instructions: String(form.get("deliveryInstructions") ?? "") || undefined,
            }
          : undefined,
      pickupInstructions: fulfillmentMethod === "pickup" ? String(form.get("pickupInstructions") ?? "") || undefined : undefined,
      schedule: { date: date ?? "", timeWindow: timeWindow ?? "" },
      paymentMethod,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      idempotencyKeyRef.current = crypto.randomUUID();
      return;
    }

    if (result.data.paymentRedirectUrl) {
      window.location.href = result.data.paymentRedirectUrl;
      return;
    }
    router.push(`/checkout/success?order=${encodeURIComponent(result.data.orderNumber)}`);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-brand-950">Your details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input id="mobile" name="mobile" required placeholder="3XXXXXXX" autoComplete="tel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company (optional)</Label>
            <Input id="companyName" name="companyName" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">Order note (optional)</Label>
          <Textarea id="note" name="note" rows={2} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-brand-950">Delivery or pickup</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="fulfillment" value="delivery" checked={fulfillmentMethod === "delivery"} onChange={() => handleFulfillmentChange("delivery")} />
            Delivery
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="fulfillment" value="pickup" checked={fulfillmentMethod === "pickup"} onChange={() => handleFulfillmentChange("pickup")} />
            Pickup
          </label>
        </div>

        {fulfillmentMethod === "delivery" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="area">Area / Governorate</Label>
              <Input id="area" name="area" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block">Block</Label>
              <Input id="block" name="block" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="road">Road</Label>
              <Input id="road" name="road" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="building">Building / House</Label>
              <Input id="building" name="building" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="flat">Flat / Office (optional)</Label>
              <Input id="flat" name="flat" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="landmark">Landmark (optional)</Label>
              <Input id="landmark" name="landmark" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="deliveryInstructions">Delivery instructions (optional)</Label>
              <Textarea id="deliveryInstructions" name="deliveryInstructions" rows={2} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-brand-100 bg-brand-50/40 p-4 text-sm">
              <p className="font-medium text-brand-950">{pickupLocationName}</p>
              <p className="text-foreground/70">{pickupLocationAddress}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pickupInstructions">Pickup instructions (optional)</Label>
              <Textarea id="pickupInstructions" name="pickupInstructions" rows={2} />
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-brand-950">Schedule</h2>
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="slot">Date and time</Label>
          <Select id="slot" name="slot" required defaultValue={firstAvailableSlot ? `${firstAvailableSlot.date}|${firstAvailableSlot.timeWindow}` : ""}>
            {!firstAvailableSlot && <option value="">No slots available</option>}
            {availableSlots.map((slot) => (
              <option key={`${slot.date}|${slot.timeWindow}`} value={`${slot.date}|${slot.timeWindow}`} disabled={!slot.available}>
                {formatSlotLabel(slot)}
                {!slot.available ? " (unavailable)" : ""}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-brand-950">Payment</h2>
        {!cashEnabled && !tapEnabled ? (
          <p role="alert" className="text-sm text-danger-600">
            No payment methods are currently available. Please check back later.
          </p>
        ) : (
          <div className="flex gap-4">
            {cashEnabled && (
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} />
                Cash on {fulfillmentMethod === "delivery" ? "delivery" : "pickup"}
              </label>
            )}
            {tapEnabled && (
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="payment" value="tap" checked={paymentMethod === "tap"} onChange={() => setPaymentMethod("tap")} />
                Pay by card
              </label>
            )}
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !firstAvailableSlot || (!cashEnabled && !tapEnabled)}>
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}
