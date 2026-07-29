"use client";

import { useState } from "react";
import type { Category } from "@/core/catalog/entities";
import { Button } from "@/ui/primitives/button";
import { CategoriesTree } from "./categories-tree";
import { CategoryForm } from "./category-form";

/**
 * Editing happens in-place on this single page (no `/admin/categories/[id]`
 * route) — the Phase 3 admin route list is deliberately just the six
 * listed in the README, and a category edit doesn't need its own route
 * when the form already renders here.
 */
export function CategoriesManager({ categories, canManage }: { categories: Category[]; canManage: boolean }) {
  const [editing, setEditing] = useState<Category | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Categories</h1>
        <CategoriesTree categories={categories} canManage={canManage} onEdit={setEditing} />
      </div>

      {canManage && (
        <div className="flex flex-col gap-4 border-t border-brand-100 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-950">{editing ? `Edit "${editing.name}"` : "Create category"}</h2>
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel edit
              </Button>
            )}
          </div>
          <CategoryForm
            key={editing?.id ?? "new"}
            category={editing ?? undefined}
            allCategories={categories}
            onSaved={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  );
}
