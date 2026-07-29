"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import type { Brand } from "@/core/catalog/entities";
import { createBrandAction, updateBrandAction } from "@/features/catalog/brands/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Textarea } from "@/ui/primitives/textarea";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  website: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export function BrandForm({ brand, onSaved }: { brand?: Brand; onSaved?: () => void }) {
  const router = useRouter();
  const isEditing = Boolean(brand);
  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [website, setWebsite] = useState(brand?.website ?? "");
  const [isActive, setIsActive] = useState(brand?.isActive ?? true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = formSchema.safeParse({ name, slug: slug || undefined, description: description || undefined, website, isActive });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setFieldError(null);

    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      website: parsed.data.website || undefined,
      isActive: parsed.data.isActive,
    };

    setIsSubmitting(true);
    try {
      const result = isEditing ? await updateBrandAction(brand!.id, payload) : await createBrandAction(payload);

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setSuccessMessage(isEditing ? "Brand updated." : `Brand "${parsed.data.name}" created.`);
      if (!isEditing) {
        setName("");
        setSlug("");
        setDescription("");
        setWebsite("");
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
        <Label htmlFor="brand-name">Name</Label>
        <Input id="brand-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-slug">Slug (optional — derived from name if left blank)</Label>
        <Input id="brand-slug" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-description">Description</Label>
        <Textarea id="brand-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-website">Website</Label>
        <Input id="brand-website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} disabled={isSubmitting} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={isSubmitting} />
        Active
      </label>

      {fieldError && (
        <p role="alert" className="text-sm text-red-600">
          {fieldError}
        </p>
      )}
      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-foreground/70">
          {successMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create brand"}
      </Button>
    </form>
  );
}
