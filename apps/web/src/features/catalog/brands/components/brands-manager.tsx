"use client";

import { useState } from "react";
import type { Brand } from "@/core/catalog/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";
import { BrandForm } from "./brand-form";
import { BrandsTable } from "./brands-table";

/** Editing happens in-place on this single page — see `CategoriesManager`'s doc comment for the same rationale. */
export function BrandsManager({ brands, canManage, locale = DEFAULT_LOCALE }: { brands: Brand[]; canManage: boolean; locale?: Locale }) {
  const dict = getDictionary(locale).admin.brandsPage;
  const [editing, setEditing] = useState<Brand | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <BrandsTable brands={brands} canManage={canManage} onEdit={setEditing} locale={locale} />
      </div>

      {canManage && (
        <div className="flex flex-col gap-4 border-t border-brand-100 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-950">{editing ? dict.editBrand.replace("{name}", editing.name) : dict.createBrand}</h2>
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                {dict.cancelEdit}
              </Button>
            )}
          </div>
          <BrandForm key={editing?.id ?? "new"} brand={editing ?? undefined} onSaved={() => setEditing(null)} locale={locale} />
        </div>
      )}
    </div>
  );
}
