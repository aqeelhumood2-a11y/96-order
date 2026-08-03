"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CmsPage } from "@/core/cms/entities";
import { deleteCmsPageAction } from "@/features/admin-cms/actions";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

export function CmsPagesTable({ pages }: { pages: CmsPage[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(page: CmsPage) {
    setError(null);
    setBusyId(page.id);
    try {
      const result = await deleteCmsPageAction(page.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (pages.length === 0) {
    return <p className="text-sm text-foreground/60">No pages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-md border border-brand-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Nav</th>
              <th className="px-4 py-2">Footer</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-t border-brand-100">
                <td className="px-4 py-2">
                  <Link href={`/admin/cms/pages/${page.id}`} className="font-medium text-brand-900 hover:underline">
                    {page.title}
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{page.slug}</td>
                <td className="px-4 py-2">
                  <Badge variant={page.status === "published" ? "success" : "neutral"}>{page.status}</Badge>
                </td>
                <td className="px-4 py-2">{page.showInNav ? "Yes" : "—"}</td>
                <td className="px-4 py-2">{page.showInFooter ? "Yes" : "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="outline" disabled={busyId === page.id} onClick={() => handleDelete(page)}>
                    {busyId === page.id ? "Deleting…" : "Delete"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
