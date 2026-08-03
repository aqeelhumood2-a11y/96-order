import type { CustomerSession } from "@/core/customer-auth/entities";
import type { PublicProduct } from "@/core/storefront/dto";
import { NotFoundError, ValidationError } from "@/core/errors";
import { wishlistMembershipKey } from "@/core/wishlist/entities";
import { addToCart, type AddToCartInput } from "@/services/cart/add-to-cart";
import type { PricedCart } from "@/core/cart/rules";
import { defaultWishlistDeps, type WishlistDeps } from "./dependencies";

export interface WishlistItemView {
  id: string;
  productId: string;
  variantId: string | null;
  addedAt: Date;
  product: PublicProduct;
}

/** Bare `productId:variantId` keys only — cheap enough to fetch once per page for highlighting already-wishlisted product cards. */
export async function listMyWishlistKeys(session: CustomerSession, deps: WishlistDeps = defaultWishlistDeps): Promise<string[]> {
  const items = await deps.wishlist.listByCustomer(session.uid);
  return items.map((item) => wishlistMembershipKey(item.productId, item.variantId));
}

/**
 * Joins wishlist rows against the live public catalog. A product that's
 * since been archived, hidden, or deleted simply can't be resolved
 * publicly any more — rather than surface a broken row, we drop it from
 * the view and best-effort delete the stale wishlist row so it doesn't
 * keep costing a lookup on every future visit. The delete is fire-and-forget:
 * a failure here just means the row is filtered again next time, never a
 * user-facing error.
 */
export async function listMyWishlist(session: CustomerSession, deps: WishlistDeps = defaultWishlistDeps): Promise<WishlistItemView[]> {
  const items = await deps.wishlist.listByCustomer(session.uid);
  const views: WishlistItemView[] = [];
  for (const item of items) {
    const product = await deps.products.findById(item.productId);
    if (!product) {
      void deps.wishlist.remove(session.uid, item.productId, item.variantId).catch(() => undefined);
      continue;
    }
    views.push({ id: item.id, productId: item.productId, variantId: item.variantId, addedAt: item.addedAt, product });
  }
  return views;
}

async function requireWishlistableProduct(productId: string, variantId: string | null, deps: WishlistDeps): Promise<PublicProduct> {
  const product = await deps.products.findById(productId);
  if (!product) {
    throw new NotFoundError("This product is no longer available.");
  }
  if (variantId && !product.variants.some((variant) => variant.id === variantId)) {
    throw new ValidationError("The selected option is no longer available.");
  }
  return product;
}

export async function addToWishlist(session: CustomerSession, productId: string, variantId: string | null, deps: WishlistDeps = defaultWishlistDeps): Promise<void> {
  await requireWishlistableProduct(productId, variantId, deps);
  await deps.wishlist.add(session.uid, productId, variantId);
  await deps.auditLogs.record({ type: "wishlist_item_added", actorUid: session.uid, actorEmail: session.email, metadata: { productId, variantId } });
}

export async function removeFromWishlist(session: CustomerSession, productId: string, variantId: string | null, deps: WishlistDeps = defaultWishlistDeps): Promise<void> {
  await deps.wishlist.remove(session.uid, productId, variantId);
  await deps.auditLogs.record({ type: "wishlist_item_removed", actorUid: session.uid, actorEmail: session.email, metadata: { productId, variantId } });
}

/** Adds the wishlist line to the cart, then removes it from the wishlist only once the cart add actually succeeds. */
export async function moveWishlistItemToCart(
  session: CustomerSession,
  input: Omit<AddToCartInput, "quantity"> & { quantity?: number },
  deps: WishlistDeps = defaultWishlistDeps,
): Promise<PricedCart> {
  const cart = await addToCart({ ...input, quantity: input.quantity ?? 1 });
  await removeFromWishlist(session, input.productId, input.variantId, deps);
  return cart;
}
