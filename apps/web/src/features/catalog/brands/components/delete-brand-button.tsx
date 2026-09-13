"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandAction } from "@/features/catalog/brands/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function DeleteBrandButton({ brandId, locale = DEFAULT_LOCALE }: { brandId: string; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.brandsPage;
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      const result = await deleteBrandAction(brandId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? dict.deleting : dict.delete}
      </Button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
