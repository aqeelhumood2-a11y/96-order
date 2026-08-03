"use server";

import { revalidatePath } from "next/cache";
import type { PricedCart } from "@/core/cart/rules";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { getOrCreateCartId } from "@/services/cart/cart-session";
import { addToWishlist, moveWishlistItemToCart, removeFromWishlist } from "@/services/wishlist/wishlist";

export async function addToWishlistAction(productId: string, variantId: string | null): Promise<ActionResult<null>> {
  return runAction(async () => {
    const session = await requireCustomerSession();
    await addToWishlist(session, productId, variantId);
    return null;
  });
}

export async function removeFromWishlistAction(productId: string, variantId: string | null): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await removeFromWishlist(session, productId, variantId);
    return null;
  });
  if (result.ok) revalidatePath("/account/wishlist");
  return result;
}

export async function moveWishlistItemToCartAction(productId: string, variantId: string | null): Promise<ActionResult<PricedCart>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    const cartId = await getOrCreateCartId();
    return moveWishlistItemToCart(session, { cartId, productId, variantId });
  });
  if (result.ok) {
    revalidatePath("/account/wishlist");
    revalidatePath("/cart");
  }
  return result;
}
