"use client";

import { useEffect } from "react";

/**
 * Registers `public/sw-images.js` — see that file's doc comment for why
 * (cache-first for images only, nothing else). Production-only: a service
 * worker persists in the browser across reloads, which is exactly wrong for
 * local development (stale code between edits) and for e2e/CI runs (a
 * cross-test cache the test suite never asked for and can't reset).
 */
export function RegisterImageCacheWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw-images.js").catch(() => undefined);
  }, []);

  return null;
}
