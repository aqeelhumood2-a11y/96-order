"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import type { Category } from "@/core/catalog/entities";
import { createCategoryAction, updateCategoryAction } from "@/features/catalog/categories/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Select } from "@/ui/primitives/select";
import { Textarea } from "@/ui/primitives/textarea";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
});

export function CategoryForm({
  category,
  allCategories,
  onSaved,
}: {
  category?: Category;
  allCategories: Category[];
  onSaved?: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableParents = allCategories.filter((candidate) => candidate.id !== category?.id);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = formSchema.safeParse({ name, slug: slug || undefined, description: description || undefined, parentId: parentId || undefined, sortOrder, isActive, seoTitle: seoTitle || undefined, seoDescription: seoDescription || undefined });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setFieldError(null);

    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      parentId: parsed.data.parentId ?? null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    };

    setIsSubmitting(true);
    try {
      const result = isEditing ? await updateCategoryAction(category!.id, payload) : await createCategoryAction(payload);

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setSuccessMessage(isEditing ? "Category updated." : `Category "${parsed.data.name}" created.`);
      if (!isEditing) {
        setName("");
        setSlug("");
        setDescription("");
        setParentId("");
        setSortOrder("0");
        setSeoTitle("");
        setSeoDescription("");
      }
      onSaved?.();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-slug">Slug (optional — derived from name if left blank)</Label>
        <Input id="category-slug" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-description">Description</Label>
        <Textarea id="category-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-parent">Parent category</Label>
        <Select id="category-parent" value={parentId} onChange={(event) => setParentId(event.target.value)} disabled={isSubmitting}>
          <option value="">No parent (top-level)</option>
          {availableParents.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-sort-order">Sort order</Label>
          <Input id="category-sort-order" type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} disabled={isSubmitting} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={isSubmitting} />
          Active
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-seo-title">SEO title</Label>
        <Input id="category-seo-title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-seo-description">SEO description</Label>
        <Textarea id="category-seo-description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} disabled={isSubmitting} />
      </div>

      {fieldError && (
        <p role="alert" className="text-sm text-danger-600">
          {fieldError}
        </p>
      )}
      {formError && (
        <p role="alert" className="text-sm text-danger-600">
          {formError}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-foreground/70">
          {successMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}
