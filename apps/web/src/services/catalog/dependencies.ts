import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { BrandRepository } from "@/core/interfaces/brand-repository";
import type { CategoryRepository } from "@/core/interfaces/category-repository";
import type { InventoryAdjustmentRepository } from "@/core/interfaces/inventory-adjustment-repository";
import type { InventoryRepository } from "@/core/interfaces/inventory-repository";
import type { ProductImageStoragePort } from "@/core/interfaces/product-image-storage-port";
import type { ProductRepository } from "@/core/interfaces/product-repository";
import { FirebaseProductImageStorage } from "@/infrastructure/firebase/product-image-storage";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreBrandRepository } from "@/infrastructure/firebase/repositories/firestore-brand-repository";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";
import { FirestoreInventoryAdjustmentRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-adjustment-repository";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";

/**
 * Composition root for `services/catalog/*`, mirroring `services/auth/dependencies.ts`.
 * Every use case accepts these as a defaultable parameter, so unit tests
 * inject mocks and never import this module (or any Firebase Admin code)
 * at all.
 */
export interface CatalogDeps {
  products: ProductRepository;
  categories: CategoryRepository;
  brands: BrandRepository;
  inventory: InventoryRepository;
  inventoryAdjustments: InventoryAdjustmentRepository;
  productImages: ProductImageStoragePort;
  auditLogs: AuditLogRepository;
}

export const defaultCatalogDeps: CatalogDeps = {
  products: new FirestoreProductRepository(),
  categories: new FirestoreCategoryRepository(),
  brands: new FirestoreBrandRepository(),
  inventory: new FirestoreInventoryRepository(),
  inventoryAdjustments: new FirestoreInventoryAdjustmentRepository(),
  productImages: new FirebaseProductImageStorage(),
  auditLogs: new FirestoreAuditLogRepository(),
};
