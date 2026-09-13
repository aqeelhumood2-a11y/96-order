"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductImage } from "@/core/catalog/entities";
import { addProductImageByUrlAction, deleteProductImageAction, uploadProductImageAction } from "@/features/catalog/products/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

export function ProductImages({
  productId,
  images,
  imageUrls,
  locale = DEFAULT_LOCALE,
}: {
  productId: string;
  images: ProductImage[];
  imageUrls: Record<string, string>;
  locale?: Locale;
}) {
  const dict = getDictionary(locale).admin.productImages;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(images.length === 0);
  const [imageUrl, setImageUrl] = useState("");
  const [urlAltText, setUrlAltText] = useState("");
  const [urlIsPrimary, setUrlIsPrimary] = useState(images.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(dict.chooseFileFirst);
      return;
    }

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("file", file);
    formData.set("altText", altText);
    formData.set("isPrimary", String(isPrimary));

    setIsUploading(true);
    try {
      const result = await uploadProductImageAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAltText("");
      setIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAddFromUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!imageUrl.trim()) {
      setError(dict.enterUrlFirst);
      return;
    }

    setIsAddingFromUrl(true);
    try {
      const result = await addProductImageByUrlAction(productId, imageUrl.trim(), urlAltText, urlIsPrimary);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setImageUrl("");
      setUrlAltText("");
      setUrlIsPrimary(false);
      router.refresh();
    } finally {
      setIsAddingFromUrl(false);
    }
  }

  async function handleDelete(imageId: string) {
    setError(null);
    setDeletingId(imageId);
    try {
      const result = await deleteProductImageAction(productId, imageId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-brand-950">{dict.heading}</h2>

      {images.length === 0 ? (
        <p className="text-sm text-foreground/69">{dict.noImages}</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {[...images]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => (
              <div key={image.id} className="flex w-40 flex-col gap-2 rounded-md border border-brand-100 p-2">
                {imageUrls[image.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview via a short-lived signed URL (or an external URL), not a Next-optimized public asset
                  <img src={imageUrls[image.id]} alt={image.altText} className="h-32 w-full rounded object-cover" />
                ) : (
                  <div className="h-32 w-full rounded bg-brand-50" />
                )}
                <p className="truncate text-xs text-foreground/69">{image.altText || dict.noAltText}</p>
                {image.isPrimary && <span className="text-xs font-medium text-brand-700">{dict.primary}</span>}
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(image.id)} disabled={deletingId === image.id}>
                  {deletingId === image.id ? dict.deleting : dict.delete}
                </Button>
              </div>
            ))}
        </div>
      )}

      <form onSubmit={handleUpload} noValidate className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-file">{dict.uploadLabel}</Label>
          <input id="product-image-file" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-alt">{dict.altText}</Label>
          <Input id="product-image-alt" value={altText} onChange={(event) => setAltText(event.target.value)} disabled={isUploading} className="w-48" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} disabled={isUploading} />
          {dict.setAsPrimary}
        </label>
        <Button type="submit" size="sm" disabled={isUploading}>
          {isUploading ? dict.uploading : dict.upload}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-foreground/50">
        <span className="h-px flex-1 bg-surface-border" />
        {dict.orDivider}
        <span className="h-px flex-1 bg-surface-border" />
      </div>

      <form onSubmit={handleAddFromUrl} noValidate className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-url">{dict.imageUrlLabel}</Label>
          <Input
            id="product-image-url"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            disabled={isAddingFromUrl}
            placeholder={dict.imageUrlPlaceholder}
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-url-alt">{dict.altText}</Label>
          <Input id="product-image-url-alt" value={urlAltText} onChange={(event) => setUrlAltText(event.target.value)} disabled={isAddingFromUrl} className="w-48" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={urlIsPrimary} onChange={(event) => setUrlIsPrimary(event.target.checked)} disabled={isAddingFromUrl} />
          {dict.setAsPrimary}
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={isAddingFromUrl}>
          {isAddingFromUrl ? dict.addingFromUrl : dict.addFromUrl}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </section>
  );
}
