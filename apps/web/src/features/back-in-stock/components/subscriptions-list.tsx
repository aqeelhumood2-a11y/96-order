"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BackInStockSubscriptionView } from "@/services/back-in-stock/list-my-subscriptions";
import { unsubscribeMyBackInStockAction } from "@/features/back-in-stock/actions";
import { Button } from "@/ui/primitives/button";

export function BackInStockSubscriptionsList({ subscriptions }: { subscriptions: BackInStockSubscriptionView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = subscriptions.filter((subscription) => subscription.status === "pending");

  if (pending.length === 0) {
    return <p className="text-sm text-foreground/60">You&apos;re not waiting on any back-in-stock alerts.</p>;
  }

  async function handleUnsubscribe(id: string) {
    setBusyId(id);
    try {
      await unsubscribeMyBackInStockAction(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {pending.map((subscription) => (
        <li key={subscription.id} className="flex items-center justify-between gap-2 rounded-md border border-brand-100 p-3 text-sm">
          {subscription.productSlug ? (
            <Link href={`/products/${subscription.productSlug}`} className="text-brand-900 hover:underline">
              {subscription.productName}
            </Link>
          ) : (
            <span className="text-foreground/50">Product no longer available</span>
          )}
          <Button size="sm" variant="outline" disabled={busyId === subscription.id} onClick={() => handleUnsubscribe(subscription.id)}>
            Unsubscribe
          </Button>
        </li>
      ))}
    </ul>
  );
}
