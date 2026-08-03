"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { wishlistMembershipKey } from "@/core/wishlist/entities";
import { addToWishlistAction, removeFromWishlistAction } from "@/features/wishlist/actions";
import { addLocalWishlistKey, clearLocalWishlist, getLocalWishlistKeys, removeLocalWishlistKey } from "@/features/wishlist/local-wishlist";

interface WishlistContextValue {
  isWishlisted(productId: string, variantId: string | null): boolean;
  toggle(productId: string, variantId: string | null): Promise<void>;
  pending: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Signed-in state drives everything here: a guest toggles keys straight in
 * `localStorage` (no network call, no account needed to "save for later"),
 * while a signed-in customer's toggles go through the wishlist Server
 * Actions and the source of truth is `keys` fetched from `/api/wishlist/keys`.
 *
 * The merge-on-login case (`signedIn` true *and* leftover guest keys still
 * in `localStorage` from before the visitor signed in) is handled once on
 * mount: replay each leftover key as a real `addToWishlistAction` call,
 * then clear `localStorage`. There's no dedicated "login transition" event
 * to hook — a full page load always follows login (the session cookie is
 * set by a Route Handler redirect), so "mounted with signedIn=true and a
 * non-empty guest list" reliably means "just logged in with items saved
 * while signed out."
 */
export function WishlistProvider({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const [keys, setKeys] = useState<Set<string>>(() => (signedIn ? new Set() : new Set(getLocalWishlistKeys())));
  const [pending, setPending] = useState(false);
  const mergedRef = useRef(false);

  useEffect(() => {
    if (!signedIn) return;

    async function loadAndMerge() {
      const guestKeys = getLocalWishlistKeys();
      if (guestKeys.length > 0 && !mergedRef.current) {
        mergedRef.current = true;
        for (const key of guestKeys) {
          const [productId, variantIdRaw] = key.split(":");
          if (!productId) continue;
          const variantId = variantIdRaw === "-" ? null : (variantIdRaw ?? null);
          await addToWishlistAction(productId, variantId).catch(() => undefined);
        }
        clearLocalWishlist();
      }

      const response = await fetch("/api/wishlist/keys").catch(() => null);
      if (!response?.ok) return;
      const body: unknown = await response.json().catch(() => null);
      const fetchedKeys = body && typeof body === "object" && Array.isArray((body as { keys?: unknown }).keys) ? ((body as { keys: string[] }).keys) : [];
      setKeys(new Set(fetchedKeys));
    }

    void loadAndMerge();
  }, [signedIn]);

  const isWishlisted = useCallback((productId: string, variantId: string | null) => keys.has(wishlistMembershipKey(productId, variantId)), [keys]);

  const toggle = useCallback(
    async (productId: string, variantId: string | null) => {
      const key = wishlistMembershipKey(productId, variantId);
      const alreadyIn = keys.has(key);
      setPending(true);
      try {
        if (signedIn) {
          const result = alreadyIn ? await removeFromWishlistAction(productId, variantId) : await addToWishlistAction(productId, variantId);
          if (!result.ok) return;
        } else {
          if (alreadyIn) removeLocalWishlistKey(key);
          else addLocalWishlistKey(key);
        }
        setKeys((current) => {
          const next = new Set(current);
          if (alreadyIn) next.delete(key);
          else next.add(key);
          return next;
        });
      } finally {
        setPending(false);
      }
    },
    [keys, signedIn],
  );

  return <WishlistContext.Provider value={{ isWishlisted, toggle, pending }}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
