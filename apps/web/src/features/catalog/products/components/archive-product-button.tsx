"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveProductAction } from "@/features/catalog/products/actions";
import { Button } from "@/ui/primitives/button";

export function ArchiveProductButton({ productId }: { productId: string }) {
  const router = useRouter();
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
        {isArchiving ? "Archiving…" : "Archive"}
      </Button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
