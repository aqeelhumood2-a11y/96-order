import type { CoffeeAttributes, Dimensions, EquipmentAttributes } from "@/core/catalog/entities";

/**
 * Public read-model DTOs — deliberately separate types from
 * `core/catalog/entities.ts`'s admin `Product`/`Category`/`Brand`, not a
 * `Pick<>`/`Omit<>` of them. This is what makes it structurally impossible
 * for a future change to accidentally leak a new private admin field to
 * the browser: adding a field to `Product` does nothing to these types
 * until someone deliberately adds it here too. Infrastructure adapters
 * (`infrastructure/firebase/repositories/firestore-public-*`) are the only
 * place an admin entity and a public DTO are ever in scope together — see
 * their doc comments for the exact fields excluded and why.
 */

export interface PublicImage {
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PublicAvailability {
  inStock: boolean;
  /** A coarse "only a few left" hint — never an exact quantity, never `reserved`/`onHand`, never adjustment history. */
  lowStock: boolean;
}

export interface PublicBrandRef {
  name: string;
  slug: string;
}

export interface PublicCategoryRef {
  name: string;
  slug: string;
}

export interface PublicVariant {
  id: string;
  sku: string;
  attributeSelections: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  weightGrams?: number;
  availability: PublicAvailability;
}

/**
 * Card/listing/search-result shape — intentionally lighter than
 * `PublicProduct` (no full description, no variants, no attributes) since
 * list views render many of these per page.
 */
export interface PublicProductSummary {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  brand: PublicBrandRef | null;
  primaryCategory: PublicCategoryRef;
  productType: string;
  tags: string[];
  featured: boolean;
  primaryImage: PublicImage | null;
  /** The product's own price, or (when it has variants) the lowest variant price — what a listing card shows as "from $X". */
  displayPrice: number;
  compareAtPrice?: number;
  hasVariants: boolean;
  availability: PublicAvailability;
  createdAt: Date;
}

/** Full product-detail shape. */
export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  fullDescription?: string;
  brand: PublicBrandRef | null;
  primaryCategory: PublicCategoryRef;
  additionalCategories: PublicCategoryRef[];
  productType: string;
  tags: string[];
  featured: boolean;
  sku: string;
  /**
   * Never populated in Phase 4 — barcode exposure is intentionally
   * controlled, and Phase 3 has no per-product "safe to show publicly"
   * flag to key that decision on. See README's Security/privacy
   * boundaries section for the reasoning and the future toggle this
   * leaves room for.
   */
  barcode?: string;
  basePrice: number;
  compareAtPrice?: number;
  weightGrams?: number;
  dimensions?: Dimensions;
  images: PublicImage[];
  hasVariants: boolean;
  variants: PublicVariant[];
  attributes?: { coffee?: CoffeeAttributes; equipment?: EquipmentAttributes };
  availability: PublicAvailability;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parent: PublicCategoryRef | null;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PublicBrand {
  id: string;
  slug: string;
  name: string;
  description?: string;
  website?: string;
  seoTitle?: string;
  seoDescription?: string;
}
