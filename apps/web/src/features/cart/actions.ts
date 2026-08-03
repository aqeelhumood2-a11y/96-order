"use server";

import { revalidatePath } from "next/cache";
import type { PricedCart } from "@/core/cart/rules";
import type { DiscountedPricedCart } from "@/core/pricing/priced-cart";
import { runAction, type ActionResult } from "@/lib/action-result";
import { addToCart } from "@/services/cart/add-to-cart";
import { clearCart } from "@/services/cart/clear-cart";
import { getOrCreateCartId } from "@/services/cart/cart-session";
import { removeCartLine } from "@/services/cart/remove-cart-line";
import { updateCartLine } from "@/services/cart/update-cart-line";
import { getCustomerSession } from "@/services/customer-auth/session";
import { applyCouponToCart, removeCouponFromCart } from "@/services/pricing/apply-coupon-to-cart";

/**
 * Every cart mutation resolves its cart id from the signed cookie
 * server-side (`getOrCreateCartId`), never from anything the client
 * passes — a Server Action already gets Next.js's built-in Origin/Host
 * check on every call, the same protection `/api/auth/session` gets from
 * `lib/csrf.ts` explicitly (see that file's doc comment).
 */
export async function addToCartAction(productId: string, variantId: string | null, quantity: number): Promise<ActionResult<PricedCart>> {
  const result = await runAction(async () => {
    const cartId = await getOrCreateCartId();
    return addToCart({ cartId, productId, variantId, quantity });
  });
  if (result.ok) revalidatePath("/cart");
  return result;
}

export async function updateCartLineAction(lineId: string, quantity: number): Promise<ActionResult<PricedCart>> {
  const result = await runAction(async () => {
    const cartId = await getOrCreateCartId();
    return updateCartLine({ cartId, lineId, quantity });
  });
  if (result.ok) revalidatePath("/cart");
  return result;
}

export async function removeCartLineAction(lineId: string): Promise<ActionResult<PricedCart>> {
  const result = await runAction(async () => {
    const cartId = await getOrCreateCartId();
    return removeCartLine({ cartId, lineId });
  });
  if (result.ok) revalidatePath("/cart");
  return result;
}

export async function clearCartAction(): Promise<ActionResult<PricedCart>> {
  const result = await runAction(async () => {
    const cartId = await getOrCreateCartId();
    return clearCart(cartId);
  });
  if (result.ok) revalidatePath("/cart");
  return result;
}

export async function applyCouponAction(code: string): Promise<ActionResult<DiscountedPricedCart>> {
  const result = await runAction(async () => {
    const cartId = await getOrCreateCartId();
    const session = await getCustomerSession();
    const { priced } = await applyCouponToCart(cartId, code, session?.email ?? null);
    return priced;
  });
  if (result.ok) revalidatePath("/cart");
  return result;
}

export async function removeCouponAction(): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const cartId = await getOrCreateCartId();
    await removeCouponFromCart(cartId);
    return null;
  });
  if (result.ok) revalidatePath("/cart");
  return result;
}
