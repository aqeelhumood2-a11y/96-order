"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRoleAction } from "@/features/roles/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function DeleteRoleButton({ roleId, locale = DEFAULT_LOCALE }: { roleId: string; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.rolesPage;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsPending(true);
    setError(null);
    try {
      const result = await deleteRoleAction(roleId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={handleDelete}>
        {dict.delete}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
