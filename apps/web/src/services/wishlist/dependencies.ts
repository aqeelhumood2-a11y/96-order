import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { PublicProductRepository } from "@/core/interfaces/public-product-repository";
import type { WishlistRepository } from "@/core/interfaces/wishlist-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreWishlistRepository } from "@/infrastructure/firebase/repositories/firestore-wishlist-repository";
import { defaultStorefrontDeps } from "@/services/storefront/dependencies";

export interface WishlistDeps {
  wishlist: WishlistRepository;
  products: PublicProductRepository;
  auditLogs: AuditLogRepository;
}

export const defaultWishlistDeps: WishlistDeps = {
  wishlist: new FirestoreWishlistRepository(),
  products: defaultStorefrontDeps.products,
  auditLogs: new FirestoreAuditLogRepository(),
};
