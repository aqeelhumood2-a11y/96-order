"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BackInStockSubscriptionView } from "@/services/back-in-stock/list-my-subscriptions";
import { unsubscribeMyBackInStockAction } from "@/features/back-in-stock/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function BackInStockSubscriptionsList({ subscriptions, locale = DEFAULT_LOCALE }: { subscriptions: BackInStockSubscriptionView[]; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.backInStock;
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = subscriptions.filter((subscription) => subscription.status === "pending");

  if (pending.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.notWaitingOnAlerts}</p>;
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
            <span className="text-foreground/65">{dict.productUnavailable}</span>
          )}
          <Button size="sm" variant="outline" disabled={busyId === subscription.id} onClick={() => handleUnsubscribe(subscription.id)}>
            {dict.unsubscribe}
          </Button>
        </li>
      ))}
    </ul>
  );
}
