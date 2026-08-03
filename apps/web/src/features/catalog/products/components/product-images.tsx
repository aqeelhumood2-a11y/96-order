"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductImage } from "@/core/catalog/entities";
import { deleteProductImageAction, uploadProductImageAction } from "@/features/catalog/products/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

export function ProductImages({
  productId,
  images,
  imageUrls,
}: {
  productId: string;
  images: ProductImage[];
  imageUrls: Record<string, string>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(images.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file first.");
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
      <h2 className="text-lg font-semibold text-brand-950">Images</h2>

      {images.length === 0 ? (
        <p className="text-sm text-foreground/69">No images uploaded yet.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {[...images]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => (
              <div key={image.id} className="flex w-40 flex-col gap-2 rounded-md border border-brand-100 p-2">
                {imageUrls[image.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview via a short-lived signed URL, not a Next-optimized public asset
                  <img src={imageUrls[image.id]} alt={image.altText} className="h-32 w-full rounded object-cover" />
                ) : (
                  <div className="h-32 w-full rounded bg-brand-50" />
                )}
                <p className="truncate text-xs text-foreground/69">{image.altText || "(no alt text)"}</p>
                {image.isPrimary && <span className="text-xs font-medium text-brand-700">Primary</span>}
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(image.id)} disabled={deletingId === image.id}>
                  {deletingId === image.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            ))}
        </div>
      )}

      <form onSubmit={handleUpload} noValidate className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-file">Upload image (JPEG, PNG, or WebP, up to 5MB)</Label>
          <input id="product-image-file" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-alt">Alt text</Label>
          <Input id="product-image-alt" value={altText} onChange={(event) => setAltText(event.target.value)} disabled={isUploading} className="w-48" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} disabled={isUploading} />
          Set as primary
        </label>
        <Button type="submit" size="sm" disabled={isUploading}>
          {isUploading ? "Uploading…" : "Upload"}
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
