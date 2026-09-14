"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveProductAction } from "@/features/catalog/products/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function ArchiveProductButton({ productId, locale = DEFAULT_LOCALE }: { productId: string; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.productsPage;
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleArchive() {
    setError(null);
    setIsArchiving(true);
    try {
      const result = await archiveProductAction(productId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleArchive} disabled={isArchiving}>
        {isArchiving ? dict.archiving : dict.archive}
      </Button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
