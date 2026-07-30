import type { CartRepository } from "@/core/interfaces/cart-repository";
import type { ProductImageStoragePort } from "@/core/interfaces/product-image-storage-port";
import type { InventoryRepository } from "@/core/interfaces/inventory-repository";
import type { ProductRepository } from "@/core/interfaces/product-repository";
import { FirebaseProductImageStorage } from "@/infrastructure/firebase/product-image-storage";
import { FirestoreCartRepository } from "@/infrastructure/firebase/repositories/firestore-cart-repository";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";

/**
 * Cart validation deliberately uses the *admin* `ProductRepository`/
 * `InventoryRepository` (full `Product`/`InventoryRecord` shape, including
 * `allowBackorder` and exact stock) rather than Phase 4's public
 * storefront DTOs — those DTOs intentionally redact operational detail
 * (exact quantities, backorder flags) for what gets sent to the browser
 * from the *product* pages, but cart validation is a privileged,
 * server-only computation that needs the real numbers to decide whether
 * a line can be added/how many, and to build this shopper's own cart
 * response (never someone else's, never a competitor scraping a product
 * page). See README's Cart architecture section.
 */
export interface CartDeps {
  carts: CartRepository;
  products: ProductRepository;
  inventory: InventoryRepository;
  images: ProductImageStoragePort;
}

export const defaultCartDeps: CartDeps = {
  carts: new FirestoreCartRepository(),
  products: new FirestoreProductRepository(),
  inventory: new FirestoreInventoryRepository(),
  images: new FirebaseProductImageStorage(),
};
