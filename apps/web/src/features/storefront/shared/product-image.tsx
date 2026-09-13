"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

export interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * `next/image` refuses to optimize any host not explicitly listed in
 * `next.config.ts`'s `images.remotePatterns` — deliberately, since that
 * allowlist is what keeps this app from proxying arbitrary third-party
 * URLs. A product image can now point at one (an admin-pasted external
 * URL, e.g. a Google Drive link — see `core/catalog/rules.ts#isExternalImageUrl`),
 * so anything not served from this app's own Firebase Storage bucket
 * renders through a plain `<img>` instead, which has no such allowlist.
 * It loses Next's automatic resizing/format conversion for that one image,
 * never functionality.
 */
function isOptimizableHost(url: string): boolean {
  try {
    const { hostname } = new URL(url, "http://localhost");
    return hostname === "firebasestorage.googleapis.com" || hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Fills its parent — the parent must provide `position: relative` and a
 * fixed aspect ratio so the image never causes layout shift while loading
 * or if it fails.
 */
export function ProductImage({ src, alt, sizes = "(min-width: 1024px) 25vw, 50vw", className, priority }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-brand-50 text-brand-300", className)} role="img" aria-label={alt}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 16 5-5 4 4 3-3 6 6" />
        </svg>
      </div>
    );
  }

  if (!isOptimizableHost(src)) {
    // eslint-disable-next-line @next/next/no-img-element -- externally-hosted image, outside next/image's remotePatterns allowlist by design
    return <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} loading={priority ? undefined : "lazy"} onError={() => setErrored(true)} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn("object-cover", className)}
      onError={() => setErrored(true)}
    />
  );
}
