"use client";

import { useId, useState } from "react";
import type { PublicOrderView } from "@/core/orders/public-view";
import { formatMoney } from "@/core/money/money";
import { trackOrderAction } from "@/features/tracking/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

export interface OrderLookupFormProps {
  initialOrderNumber?: string;
  heading?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  preparing: "Preparing your order",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderLookupForm({ initialOrderNumber, heading = "Track your order" }: OrderLookupFormProps) {
  const orderNumberId = useId();
  const contactId = useId();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? "");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PublicOrderView | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setView(null);

    const isEmail = contact.includes("@");
    const result = await trackOrderAction({
      orderNumber: orderNumber.trim(),
      email: isEmail ? contact.trim() : undefined,
      mobile: isEmail ? undefined : contact.trim(),
    });

    if (!result.ok) {
      setStatus("error");
      setError(result.message);
      return;
    }
    setStatus("idle");
    setView(result.data);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{heading}</h1>
      <p className="mt-2 text-sm text-foreground/70">Enter your order number and the mobile number or email you used at checkout.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={orderNumberId}>Order number</Label>
          <Input
            id={orderNumberId}
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="ORD-260130-ABCDEF"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={contactId}>Mobile number or email</Label>
          <Input id={contactId} value={contact} onChange={(event) => setContact(event.target.value)} required />
        </div>
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Looking up…" : "Track order"}
        </Button>
        {status === "error" && error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {view && (
        <div className="mt-8 rounded-lg border border-brand-100 bg-brand-50/40 p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-brand-950">{view.orderNumber}</p>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900">{STATUS_LABELS[view.status] ?? view.status}</span>
          </div>
          <dl className="mt-4 space-y-1 text-sm text-foreground/70">
            <div className="flex justify-between">
              <dt>Fulfillment</dt>
              <dd className="capitalize text-brand-950">{view.fulfillmentMethod}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Scheduled for</dt>
              <dd className="text-brand-950">
                {view.schedule.date}, {view.schedule.timeWindow}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Payment</dt>
              <dd className="text-brand-950">{view.paymentStatusLabel}</dd>
            </div>
            <div className="flex justify-between border-t border-brand-200 pt-2 text-base font-semibold text-brand-950">
              <dt>Total</dt>
              <dd>{formatMoney(view.grandTotal)}</dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-1 text-sm text-foreground/70">
            {view.items.map((item, index) => (
              <li key={index}>
                {item.productName} × {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
