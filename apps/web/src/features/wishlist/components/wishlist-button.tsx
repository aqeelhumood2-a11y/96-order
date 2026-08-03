"use client";

import { useWishlist } from "@/features/wishlist/wishlist-context";

export interface WishlistButtonProps {
  productId: string;
  variantId: string | null;
  className?: string;
}

/** Heart toggle used on both product cards and the product detail page — reads/writes through `WishlistProvider`, so guest vs. signed-in is invisible to callers. */
export function WishlistButton({ productId, variantId, className }: WishlistButtonProps) {
  const { isWishlisted, toggle, pending } = useWishlist();
  const active = isWishlisted(productId, variantId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle(productId, variantId);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-100 bg-background/90 text-brand-700 transition-colors hover:text-accent-600 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4 6 4c2.2 0 3.8 1.2 6 3.6C14.2 5.2 15.8 4 18 4c4 0 5.5 4 4 7.7-2.5 4.7-10 9.3-10 9.3Z" />
      </svg>
    </button>
  );
}
