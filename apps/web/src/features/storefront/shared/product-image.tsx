"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { isImageCached, markImageLoaded } from "./image-load-cache";

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
  // Computed once at mount from `image-load-cache.ts` (filled in either by
  // an earlier view or by `ProductGallery`'s upfront preload) — an
  // already-cached image skips the spinner entirely instead of flashing it
  // for an image that's actually already sitting in the browser's cache.
  // Callers that swap `src` on an already-mounted instance (e.g.
  // `ProductGallery`'s main image, switching between thumbnails) must key
  // this component by `src` so a genuinely different image gets a fresh
  // mount — and therefore a fresh cache check — instead of carrying over
  // the previous image's loaded state.
  const [loaded, setLoaded] = useState(() => !!src && isImageCached(src));

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

  function handleLoad() {
    markImageLoaded(src as string);
    setLoaded(true);
  }

  const spinner = !loaded && (
    <div className="absolute inset-0 flex items-center justify-center bg-brand-50" aria-hidden="true">
      <svg className="h-6 w-6 animate-spin text-brand-300" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
      </svg>
    </div>
  );

  if (!isOptimizableHost(src)) {
    return (
      <>
        {spinner}
        {/* eslint-disable-next-line @next/next/no-img-element -- externally-hosted image, outside next/image's remotePatterns allowlist by design */}
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", loaded ? "opacity-100" : "opacity-0", className)}
          loading={priority ? undefined : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onLoad={handleLoad}
          onError={() => setErrored(true)}
        />
      </>
    );
  }

  return (
    <>
      {spinner}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn("object-cover", loaded ? "opacity-100" : "opacity-0", className)}
        onLoad={handleLoad}
        onError={() => setErrored(true)}
      />
    </>
  );
}
