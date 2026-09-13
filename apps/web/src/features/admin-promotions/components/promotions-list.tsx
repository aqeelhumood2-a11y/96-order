"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Promotion } from "@/core/promotions/entities";
import { setPromotionActiveAction } from "@/features/admin-promotions/actions";
import { PromotionForm } from "@/features/admin-promotions/components/promotion-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

export function PromotionsList({ promotions, locale = DEFAULT_LOCALE }: { promotions: Promotion[]; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.promotionsPage;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggleActive(promotion: Promotion) {
    setBusyId(promotion.id);
    try {
      await setPromotionActiveAction(promotion.id, !promotion.active);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {promotions.map((promotion) =>
        editingId === promotion.id ? (
          <PromotionForm key={promotion.id} existing={promotion} onDone={() => setEditingId(null)} locale={locale} />
        ) : (
          <div key={promotion.id} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-brand-950">{promotion.name}</span>
              <Badge variant={promotion.active ? "success" : "neutral"}>{promotion.active ? dict.active : dict.inactive}</Badge>
            </div>
            <p className="text-xs text-foreground/65">
              {promotion.type === "percentage"
                ? dict.percentOff.replace("{value}", String(promotion.value))
                : promotion.type === "fixed"
                  ? dict.amountOff.replace("{value}", String(promotion.value))
                  : dict.freeDelivery}{" "}
              · {dict.priority.replace("{priority}", String(promotion.priority))} · {promotion.stackable ? dict.stackable : dict.exclusive}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingId(promotion.id)}>
                {dict.edit}
              </Button>
              <Button size="sm" variant="outline" disabled={busyId === promotion.id} onClick={() => handleToggleActive(promotion)}>
                {promotion.active ? dict.deactivate : dict.activate}
              </Button>
            </div>
          </div>
        ),
      )}

      {showNewForm ? (
        <PromotionForm onDone={() => setShowNewForm(false)} locale={locale} />
      ) : (
        <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowNewForm(true)}>
          {dict.newPromotion}
        </Button>
      )}
    </div>
  );
}
