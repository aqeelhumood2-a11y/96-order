import type { PublicBrandRepository } from "@/core/interfaces/public-brand-repository";
import type { PublicCategoryRepository } from "@/core/interfaces/public-category-repository";
import type { PublicInventoryAvailabilityPort } from "@/core/interfaces/public-inventory-availability-port";
import type { PublicProductRepository } from "@/core/interfaces/public-product-repository";
import { FirebaseProductImageStorage } from "@/infrastructure/firebase/product-image-storage";
import { FirestorePublicBrandRepository } from "@/infrastructure/firebase/repositories/firestore-public-brand-repository";
import { FirestorePublicCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-public-category-repository";
import { FirestorePublicInventoryAvailability } from "@/infrastructure/firebase/repositories/firestore-public-inventory-availability";
import { FirestorePublicProductRepository } from "@/infrastructure/firebase/repositories/firestore-public-product-repository";

/**
 * Composition root for `services/storefront/*`, mirroring
 * `services/catalog/dependencies.ts` and `services/auth/dependencies.ts`.
 * Every use case accepts these as a defaultable parameter, so unit tests
 * inject mocks and never import Firebase Admin at all. This reuses Phase
 * 3's `FirebaseProductImageStorage` directly (the same download-token
 * mechanism serves both the admin preview and the public storefront —
 * there's no reason for a second implementation).
 */
export interface StorefrontDeps {
  products: PublicProductRepository;
  categories: PublicCategoryRepository;
  brands: PublicBrandRepository;
  availability: PublicInventoryAvailabilityPort;
}

const categories = new FirestorePublicCategoryRepository();
const brands = new FirestorePublicBrandRepository();
const availability = new FirestorePublicInventoryAvailability();
const images = new FirebaseProductImageStorage();

export const defaultStorefrontDeps: StorefrontDeps = {
  products: new FirestorePublicProductRepository(categories, brands, availability, images),
  categories,
  brands,
  availability,
};
