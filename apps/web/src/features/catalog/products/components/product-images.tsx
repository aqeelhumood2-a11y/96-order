"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductImage } from "@/core/catalog/entities";
import { normalizeImageUrl, toDriveProxyUrl } from "@/core/catalog/rules";
import { addProductImageByUrlAction, deleteProductImageAction } from "@/features/catalog/products/actions";
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
  const [imageUrl, setImageUrl] = useState("");
  const [urlIsPrimary, setUrlIsPrimary] = useState(images.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Converted the same way, and at the same call site, as the saved value
  // will be (see `addProductImageByUrl`) — so what the admin sees here
  // before saving is exactly what will actually be stored and displayed
  // afterward, not just a guess at what the pasted link might resolve to.
  // `NEXT_PUBLIC_GOOGLE_DRIVE_IMAGE_PROXY_ENABLED` mirrors whether the
  // server has `GOOGLE_DRIVE_API_KEY` configured (see
  // `product-image-storage.ts#getDownloadUrl`) — a client component can't
  // read that server secret directly, so this flag is how it learns
  // whether to preview through the reliable `/api/drive-image` proxy
  // instead of the raw, occasionally-403 Drive hotlink.
  const trimmedImageUrl = imageUrl.trim();
  const isDriveProxyEnabled = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_IMAGE_PROXY_ENABLED === "true";
  const previewUrl = trimmedImageUrl
    ? isDriveProxyEnabled
      ? toDriveProxyUrl(normalizeImageUrl(trimmedImageUrl))
      : normalizeImageUrl(trimmedImageUrl)
    : "";

  async function handleAddFromUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!imageUrl.trim()) {
      setError(dict.enterUrlFirst);
      return;
    }

    setIsAddingFromUrl(true);
    try {
      const result = await addProductImageByUrlAction(productId, imageUrl.trim(), "", urlIsPrimary);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setImageUrl("");
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
                {imageUrls[image.id] && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview via a short-lived signed URL (or an external URL), not a Next-optimized public asset
                  <img src={imageUrls[image.id]} alt={image.altText} className="h-32 w-full rounded object-cover" />
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

      <form onSubmit={handleAddFromUrl} noValidate className="flex flex-col gap-3">
        {previewUrl && (
          <div className="h-32 w-32 overflow-hidden rounded-md border border-brand-100 bg-brand-50">
            {/* eslint-disable-next-line @next/next/no-img-element -- ad-hoc preview of a not-yet-saved external URL, not a Next-optimized public asset */}
            <img key={previewUrl} src={previewUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
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
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={urlIsPrimary} onChange={(event) => setUrlIsPrimary(event.target.checked)} disabled={isAddingFromUrl} />
            {dict.setAsPrimary}
          </label>
          <Button type="submit" size="sm" disabled={isAddingFromUrl}>
            {isAddingFromUrl ? dict.addingFromUrl : dict.addFromUrl}
          </Button>
        </div>
        <p className="text-xs text-foreground/60">{dict.imageUrlHint}</p>
      </form>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </section>
  );
}
