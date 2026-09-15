"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { BRAND_TYPES, type Brand } from "@/core/catalog/entities";
import { createBrandAction, updateBrandAction } from "@/features/catalog/brands/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Select } from "@/ui/primitives/select";
import { Textarea } from "@/ui/primitives/textarea";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  website: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  brandType: z.enum(BRAND_TYPES),
  isActive: z.boolean(),
});

export function BrandForm({ brand, onSaved, locale = DEFAULT_LOCALE }: { brand?: Brand; onSaved?: () => void; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.brandForm;
  const isEditing = Boolean(brand);
  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [website, setWebsite] = useState(brand?.website ?? "");
  const [brandType, setBrandType] = useState<(typeof BRAND_TYPES)[number]>(brand?.brandType ?? "coffee");
  const [isActive, setIsActive] = useState(brand?.isActive ?? true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = formSchema.safeParse({ name, slug: slug || undefined, description: description || undefined, website, brandType, isActive });
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
      brandType: parsed.data.brandType,
      isActive: parsed.data.isActive,
    };

    setIsSubmitting(true);
    try {
      const result = isEditing ? await updateBrandAction(brand!.id, payload) : await createBrandAction(payload);

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setSuccessMessage(isEditing ? dict.brandUpdated : dict.brandCreated.replace("{name}", parsed.data.name));
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
        <Label htmlFor="brand-name">{dict.name}</Label>
        <Input id="brand-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-slug">{dict.slug}</Label>
        <Input id="brand-slug" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-description">{dict.description}</Label>
        <Textarea id="brand-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-website">{dict.website}</Label>
        <Input id="brand-website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-type">{dict.brandType}</Label>
        <Select id="brand-type" value={brandType} onChange={(event) => setBrandType(event.target.value as (typeof BRAND_TYPES)[number])} disabled={isSubmitting}>
          <option value="coffee">{dict.brandTypeCoffee}</option>
          <option value="equipment">{dict.brandTypeEquipment}</option>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={isSubmitting} />
        {dict.active}
      </label>

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
        {isSubmitting ? dict.saving : isEditing ? dict.saveChanges : dict.createBrand}
      </Button>
    </form>
  );
}
