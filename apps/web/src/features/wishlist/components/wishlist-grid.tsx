"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WishlistItemView } from "@/services/wishlist/wishlist";
import { removeFromWishlistAction, moveWishlistItemToCartAction } from "@/features/wishlist/actions";
import { ProductImage } from "@/features/storefront/shared/product-image";
import { PriceDisplay } from "@/features/storefront/shared/price-display";
import { AvailabilityBadge } from "@/features/storefront/shared/availability-badge";
import { Button } from "@/ui/primitives/button";

export function WishlistGrid({ items }: { items: WishlistItemView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function handleRemove(item: WishlistItemView) {
    setBusyId(item.id);
    try {
      await removeFromWishlistAction(item.productId, item.variantId);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMoveToCart(item: WishlistItemView) {
    setBusyId(item.id);
    setMessages((current) => ({ ...current, [item.id]: "" }));
    try {
      const result = await moveWishlistItemToCartAction(item.productId, item.variantId);
      if (!result.ok) {
        setMessages((current) => ({ ...current, [item.id]: result.message }));
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-foreground/69">Your wishlist is empty. Browse products and tap the heart to save them here.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const variant = item.variantId ? item.product.variants.find((candidate) => candidate.id === item.variantId) : undefined;
        const price = variant?.price ?? item.product.basePrice;
        const compareAtPrice = variant?.compareAtPrice ?? item.product.compareAtPrice;
        const availability = variant?.availability ?? item.product.availability;

        return (
          <div key={item.id} className="flex flex-col overflow-hidden rounded-lg border border-brand-100 bg-background">
            <Link href={`/products/${item.product.slug}`} className="relative aspect-square w-full bg-brand-50">
              <ProductImage src={item.product.images[0]?.url} alt={item.product.images[0]?.altText ?? item.product.name} sizes="(min-width: 1024px) 25vw, 50vw" />
            </Link>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <Link href={`/products/${item.product.slug}`} className="line-clamp-2 font-medium text-brand-950 hover:underline">
                {item.product.name}
              </Link>
              <div className="mt-1 flex items-center justify-between">
                <PriceDisplay price={price} compareAtPrice={compareAtPrice} />
                <AvailabilityBadge availability={availability} />
              </div>
              <div className="mt-auto flex flex-col gap-2 pt-3">
                <Button size="sm" disabled={busyId === item.id || !availability.inStock} onClick={() => handleMoveToCart(item)}>
                  {availability.inStock ? "Move to cart" : "Out of stock"}
                </Button>
                <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => handleRemove(item)}>
                  Remove
                </Button>
                {messages[item.id] && (
                  <p role="alert" className="text-xs text-danger-600">
                    {messages[item.id]}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
