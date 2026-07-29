import { z } from "zod";
import { INVENTORY_ADJUSTMENT_REASONS, PRODUCT_STATUSES, PRODUCT_VISIBILITIES } from "./entities";

/**
 * All money fields are validated as non-negative finite numbers in the
 * smallest currency unit (e.g. cents) — this avoids floating-point
 * rounding surprises and matches common practice, but no currency or tax
 * calculation is implemented in Phase 3; see README's Known limitations.
 */
const money = z.number().finite().nonnegative();

const dimensionsSchema = z.object({
  lengthCm: z.number().finite().positive(),
  widthCm: z.number().finite().positive(),
  heightCm: z.number().finite().positive(),
});

const coffeeAttributesSchema = z
  .object({
    beanType: z.string().trim().min(1).optional(),
    roastLevel: z.string().trim().min(1).optional(),
    originCountry: z.string().trim().min(1).optional(),
    region: z.string().trim().min(1).optional(),
    farmOrProducer: z.string().trim().min(1).optional(),
    processingMethod: z.string().trim().min(1).optional(),
    altitudeMeters: z.number().finite().nonnegative().optional(),
    variety: z.string().trim().min(1).optional(),
    tastingNotes: z.array(z.string().trim().min(1)).optional(),
    grindType: z.string().trim().min(1).optional(),
    roastDate: z.coerce.date().optional(),
    bestBeforeDate: z.coerce.date().optional(),
    netWeightGrams: z.number().finite().nonnegative().optional(),
  })
  .strict();

const equipmentAttributesSchema = z
  .object({
    manufacturer: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    material: z.string().trim().min(1).optional(),
    color: z.string().trim().min(1).optional(),
    capacity: z.string().trim().min(1).optional(),
    voltage: z.string().trim().min(1).optional(),
    wattage: z.number().finite().nonnegative().optional(),
    plugType: z.string().trim().min(1).optional(),
    warrantyPeriod: z.string().trim().min(1).optional(),
    compatibility: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const productAttributesSchema = z
  .object({
    coffee: coffeeAttributesSchema.optional(),
    equipment: equipmentAttributesSchema.optional(),
  })
  .strict();

const variantAttributeSelectionsSchema = z.record(z.string().trim().min(1), z.string().trim().min(1));

export const variantInputSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    sku: z.string().trim().min(1, "SKU is required."),
    barcode: z.string().trim().min(1).optional(),
    priceOverride: money.optional(),
    compareAtPriceOverride: money.optional(),
    costOverride: money.optional(),
    weightGramsOverride: z.number().finite().nonnegative().optional(),
    attributeSelections: variantAttributeSelectionsSchema,
    status: z.enum(PRODUCT_STATUSES).default("active"),
    trackInventory: z.boolean().default(true),
    allowBackorder: z.boolean().default(false),
    lowStockThreshold: z.number().int().nonnegative().optional(),
  })
  .refine((variant) => Object.keys(variant.attributeSelections).length > 0, {
    message: "A variant needs at least one attribute selection.",
    path: ["attributeSelections"],
  });

export type VariantInput = z.input<typeof variantInputSchema>;

const baseProductFields = {
  name: z.string().trim().min(1, "Name is required.").max(200),
  /** Defaults to a slugified `name` in the service layer when omitted — see `services/catalog/create-product.ts`. */
  slug: z.string().trim().min(1).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  fullDescription: z.string().trim().max(20_000).optional(),
  brandId: z.string().trim().min(1).nullable().default(null),
  primaryCategoryId: z.string().trim().min(1, "A primary category is required."),
  additionalCategoryIds: z.array(z.string().trim().min(1)).default([]),
  productType: z.string().trim().min(1, "Product type is required.").max(100),
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  visibility: z.enum(PRODUCT_VISIBILITIES).default("hidden"),
  featured: z.boolean().default(false),
  sku: z.string().trim().min(1, "SKU is required."),
  barcode: z.string().trim().min(1).optional(),
  basePrice: money,
  compareAtPrice: money.optional(),
  costPrice: money.optional(),
  taxClass: z.string().trim().min(1).optional(),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  weightGrams: z.number().finite().nonnegative().optional(),
  dimensions: dimensionsSchema.optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(500).optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(variantInputSchema).default([]),
  attributes: productAttributesSchema.optional(),
};

export const createProductSchema = z.object(baseProductFields).refine(
  (product) => isCompareAtPriceValidSchema(product.basePrice, product.compareAtPrice),
  { message: "Compare-at price must be greater than the base price.", path: ["compareAtPrice"] },
);

export const updateProductSchema = z
  .object({ ...baseProductFields, version: z.number().int().nonnegative() })
  .partial()
  .extend({ version: z.number().int().nonnegative() })
  .refine((product) => isCompareAtPriceValidSchema(product.basePrice, product.compareAtPrice), {
    message: "Compare-at price must be greater than the base price.",
    path: ["compareAtPrice"],
  });

function isCompareAtPriceValidSchema(basePrice: number | undefined, compareAtPrice: number | undefined): boolean {
  if (compareAtPrice === undefined || basePrice === undefined) return true;
  return compareAtPrice > basePrice;
}

export type CreateProductInput = z.input<typeof createProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;

const categoryFields = {
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().max(2000).optional(),
  parentId: z.string().trim().min(1).nullable().default(null),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  imageRef: z.string().trim().min(1).optional(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(500).optional(),
};

export const createCategorySchema = z.object(categoryFields);
export const updateCategorySchema = z.object(categoryFields).partial();
export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;

const brandFields = {
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().max(2000).optional(),
  logoRef: z.string().trim().min(1).optional(),
  website: z.string().trim().url().optional(),
  isActive: z.boolean().default(true),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(500).optional(),
};

export const createBrandSchema = z.object(brandFields);
export const updateBrandSchema = z.object(brandFields).partial();
export type CreateBrandInput = z.input<typeof createBrandSchema>;
export type UpdateBrandInput = z.input<typeof updateBrandSchema>;

export const adjustInventorySchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().default(null),
  reason: z.enum(INVENTORY_ADJUSTMENT_REASONS),
  quantityDelta: z.number().int().refine((value) => value !== 0, "Adjustment quantity cannot be zero."),
  note: z.string().trim().max(1000).optional(),
});
export type AdjustInventoryInput = z.input<typeof adjustInventorySchema>;

export const PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadProductImageSchema = z.object({
  productId: z.string().trim().min(1),
  contentType: z.enum(PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(PRODUCT_IMAGE_MAX_SIZE_BYTES, "Image exceeds the 5MB size limit."),
  altText: z.string().trim().max(300).default(""),
  isPrimary: z.boolean().default(false),
});
export type UploadProductImageInput = z.input<typeof uploadProductImageSchema>;
