/**
 * Phase 3 catalog domain entities. These are plain data shapes — no
 * Firestore types leak in here (see `infrastructure/firebase/repositories`
 * for the Timestamp <-> Date mapping at the storage boundary).
 */

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_VISIBILITIES = ["visible", "hidden"] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITIES)[number];

export interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

/**
 * Optional, coffee-specific structured attributes. Every field is optional
 * and this entire object is itself optional on `Product` — an equipment
 * product simply never has one. Kept as its own typed group (rather than
 * flattening `roastLevel`, `originCountry`, etc. directly onto `Product`)
 * so a future product family's attributes can be added the same way
 * without every existing product doc gaining more and more unused nullable
 * fields.
 */
export interface CoffeeAttributes {
  beanType?: string;
  roastLevel?: string;
  originCountry?: string;
  region?: string;
  farmOrProducer?: string;
  processingMethod?: string;
  altitudeMeters?: number;
  variety?: string;
  tastingNotes?: string[];
  grindType?: string;
  roastDate?: Date;
  bestBeforeDate?: Date;
  netWeightGrams?: number;
}

/** Optional, equipment-specific structured attributes — see `CoffeeAttributes` doc comment for the rationale. */
export interface EquipmentAttributes {
  manufacturer?: string;
  model?: string;
  material?: string;
  color?: string;
  capacity?: string;
  voltage?: string;
  wattage?: number;
  plugType?: string;
  warrantyPeriod?: string;
  compatibility?: string[];
}

/**
 * The extensible attribute bag. Both groups are optional and independent —
 * a product can have neither, either, or (in principle) both. Adding a
 * future family's attributes (e.g. `tea?: TeaAttributes`) means adding one
 * more optional field here, not touching any existing product.
 */
export interface ProductAttributes {
  coffee?: CoffeeAttributes;
  equipment?: EquipmentAttributes;
}

/** Free-form key -> selected-value pairs, e.g. `{ bagSize: "500g", grind: "wholeBean" }". */
export type VariantAttributeSelections = Record<string, string>;

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  priceOverride?: number;
  compareAtPriceOverride?: number;
  costOverride?: number;
  weightGramsOverride?: number;
  attributeSelections: VariantAttributeSelections;
  status: ProductStatus;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
}

export interface ProductImage {
  id: string;
  /** Server-generated Storage object path, e.g. `products/{productId}/{imageId}.webp` — never derived from user input. */
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  brandId: string | null;
  primaryCategoryId: string;
  additionalCategoryIds: string[];
  /**
   * Free-form string, e.g. `"coffee_beans"`, `"grinder"` — deliberately not
   * a fixed enum, so the catalog stays configurable for product families
   * beyond the ones Phase 3 ships with.
   */
  productType: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  featured: boolean;
  sku: string;
  barcode?: string;
  basePrice: number;
  compareAtPrice?: number;
  costPrice?: number;
  /** Placeholder only — no tax calculation exists yet. See README's Known limitations. */
  taxClass?: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
  weightGrams?: number;
  dimensions?: Dimensions;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  hasVariants: boolean;
  variants: ProductVariant[];
  attributes?: ProductAttributes;
  images: ProductImage[];
  /**
   * Denormalized, server-computed search index — see
   * `core/catalog/rules.ts#buildSearchTokens` and README's Phase 4 Search
   * strategy section. Never accepted from client input (absent from
   * `core/catalog/schemas.ts`'s create/update schemas entirely); recomputed
   * server-side on every create/update.
   */
  searchTokens: string[];
  /** Optimistic-concurrency guard — see `services/catalog/update-product.ts`. */
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  imageRef?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoRef?: string;
  website?: string;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * One record per (productId, variantId | null) pair — `null` variantId
 * means the product has no variants and is tracked at the product level.
 * `available` is intentionally NOT a stored field — see
 * `core/catalog/rules.ts#computeAvailableQuantity` for why.
 */
export interface InventoryRecord {
  id: string;
  productId: string;
  variantId: string | null;
  onHand: number;
  reserved: number;
  lowStockThreshold?: number;
  updatedAt: Date;
  updatedBy: string;
}

export const INVENTORY_ADJUSTMENT_REASONS = [
  "initial_stock",
  "stock_in",
  "stock_out",
  "correction",
  "damaged",
  "returned",
  "manual_adjustment",
] as const;
export type InventoryAdjustmentReason = (typeof INVENTORY_ADJUSTMENT_REASONS)[number];

/** Append-only ledger entry — see `FirestoreInventoryAdjustmentRepository` for why this can't be edited after the fact. */
export interface InventoryAdjustment {
  id: string;
  inventoryId: string;
  productId: string;
  variantId: string | null;
  reason: InventoryAdjustmentReason;
  quantityDelta: number;
  onHandBefore: number;
  onHandAfter: number;
  note?: string;
  actorId: string;
  createdAt: Date;
}
