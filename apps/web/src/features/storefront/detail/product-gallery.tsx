"use client";

import { useState } from "react";
import type { PublicImage } from "@/core/storefront/dto";
import { ProductImage } from "@/features/storefront/shared/product-image";
import { cn } from "@/lib/cn";

export function ProductGallery({ images, productName }: { images: PublicImage[]; productName: string }) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-brand-50">
        <ProductImage src={active?.url} alt={active?.altText ?? productName} priority sizes="(min-width: 1024px) 40vw, 100vw" />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Product images">
          {sorted.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1} of ${sorted.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                index === activeIndex ? "border-brand-600" : "border-transparent",
              )}
            >
              <ProductImage src={image.url} alt={image.altText} sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
