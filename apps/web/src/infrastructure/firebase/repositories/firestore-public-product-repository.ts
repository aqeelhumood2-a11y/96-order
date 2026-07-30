import "server-only";
import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type {
  CoffeeAttributes,
  Dimensions,
  ProductAttributes,
  ProductImage,
  ProductStatus,
  ProductVariant,
  ProductVisibility,
} from "@/core/catalog/entities";
import type { AvailabilityRequest, PublicInventoryAvailabilityPort } from "@/core/interfaces/public-inventory-availability-port";
import type { PublicBrandRepository } from "@/core/interfaces/public-brand-repository";
import type { PublicCategoryRepository } from "@/core/interfaces/public-category-repository";
import type { ProductImageStoragePort } from "@/core/interfaces/product-image-storage-port";
import type { PublicProductListFilter, PublicProductRepository } from "@/core/interfaces/public-product-repository";
import type { Page } from "@/core/interfaces/repository";
import type {
  PublicAvailability,
  PublicBrandRef,
  PublicCategoryRef,
  PublicImage,
  PublicProduct,
  PublicProductSummary,
  PublicVariant,
} from "@/core/storefront/dto";
import type { ProductSortOption } from "@/core/storefront/schemas";
import { getAdminFirestore } from "../admin";

const COLLECTION = "products";

interface CoffeeAttributesDoc extends Omit<CoffeeAttributes, "roastDate" | "bestBeforeDate"> {
  roastDate?: Timestamp;
  bestBeforeDate?: Timestamp;
}

interface ProductImageDoc extends Omit<ProductImage, "uploadedAt"> {
  uploadedAt: Timestamp;
}

interface ProductDoc {
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  brandId: string | null;
  primaryCategoryId: string;
  additionalCategoryIds: string[];
  productType: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  featured: boolean;
  sku: string;
  basePrice: number;
  compareAtPrice?: number;
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
  attributes?: Omit<ProductAttributes, "coffee"> & { coffee?: CoffeeAttributesDoc };
  images: ProductImageDoc[];
  createdAt: Timestamp;
}

const SORT_FIELDS: Record<ProductSortOption, string> = {
  newest: "createdAt",
  name: "name",
  price_asc: "basePrice",
  price_desc: "basePrice",
};

/**
 * Every method bakes `status == "active"` and `visibility == "visible"`
 * into its query — see the port's doc comment. `list()` pushes down at
 * most one optional equality filter (category, then brand, then
 * productType, then featured, in that priority) to keep the composite-
 * index list finite; every other requested filter dimension is applied by
 * the service layer over the bounded page this returns — see README's
 * Filters and pagination section.
 */
export class FirestorePublicProductRepository implements PublicProductRepository {
  constructor(
    private readonly categories: PublicCategoryRepository,
    private readonly brands: PublicBrandRepository,
    private readonly availability: PublicInventoryAvailabilityPort,
    private readonly images: ProductImageStoragePort,
  ) {}

  private db() {
    return getAdminFirestore();
  }

  private baseQuery(): Query {
    return this.db().collection(COLLECTION).where("status", "==", "active").where("visibility", "==", "visible");
  }

  async list(filter: PublicProductListFilter): Promise<Page<PublicProductSummary>> {
    let query = this.baseQuery();

    if (filter.categoryId) {
      query = query.where("primaryCategoryId", "==", filter.categoryId);
    } else if (filter.brandId) {
      query = query.where("brandId", "==", filter.brandId);
    } else if (filter.productType) {
      query = query.where("productType", "==", filter.productType);
    } else if (filter.featured !== undefined) {
      query = query.where("featured", "==", filter.featured);
    }

    const sortDirection = filter.sort === "price_desc" || filter.sort === "newest" ? "desc" : "asc";
    query = query.orderBy(SORT_FIELDS[filter.sort], sortDirection).limit(filter.limit);

    if (filter.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(filter.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();
    const items = await this.toSummaries(snap.docs);
    const nextCursor = snap.docs.length === filter.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async findBySlug(slug: string): Promise<PublicProduct | null> {
    const snap = await this.baseQuery().where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : this.toDetail(snap.docs[0]!);
  }

  async listFeatured(limit: number): Promise<PublicProductSummary[]> {
    const snap = await this.baseQuery().where("featured", "==", true).orderBy("createdAt", "desc").limit(limit).get();
    return this.toSummaries(snap.docs);
  }

  async listNewArrivals(limit: number): Promise<PublicProductSummary[]> {
    const snap = await this.baseQuery().orderBy("createdAt", "desc").limit(limit).get();
    return this.toSummaries(snap.docs);
  }

  async listByCategoryId(categoryId: string, excludeProductId: string, limit: number): Promise<PublicProductSummary[]> {
    // +1 covers the case where the current product itself is in the
    // returned page and needs excluding, without a second round trip.
    const snap = await this.baseQuery()
      .where("primaryCategoryId", "==", categoryId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1)
      .get();
    const docs = snap.docs.filter((doc) => doc.id !== excludeProductId).slice(0, limit);
    return this.toSummaries(docs);
  }

  async searchByToken(primaryToken: string, cursor: string | undefined, limit: number): Promise<Page<PublicProductSummary>> {
    let query = this.baseQuery().where("searchTokens", "array-contains", primaryToken).orderBy("createdAt", "desc").limit(limit);

    if (cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();
    const items = await this.toSummaries(snap.docs);
    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  /** Deduped, parallel lookups — small N in practice (a page's distinct brand count), not one query per product. */
  private async resolveBrandRefs(ids: readonly (string | null)[]): Promise<Map<string, PublicBrandRef>> {
    const distinct = Array.from(new Set(ids.filter((id): id is string => id !== null)));
    const resolved = await Promise.all(distinct.map((id) => this.brands.findById(id)));
    const map = new Map<string, PublicBrandRef>();
    distinct.forEach((id, index) => {
      const brand = resolved[index];
      if (brand) map.set(id, { name: brand.name, slug: brand.slug });
    });
    return map;
  }

  private async resolveCategoryRefs(ids: readonly string[]): Promise<Map<string, PublicCategoryRef>> {
    const distinct = Array.from(new Set(ids));
    const resolved = await Promise.all(distinct.map((id) => this.categories.findById(id)));
    const map = new Map<string, PublicCategoryRef>();
    distinct.forEach((id, index) => {
      const category = resolved[index];
      if (category) map.set(id, { name: category.name, slug: category.slug });
    });
    return map;
  }

  private async resolveImage(image: ProductImageDoc): Promise<PublicImage> {
    const url = await this.images.getDownloadUrl(image.storagePath);
    return { url, altText: image.altText, isPrimary: image.isPrimary, sortOrder: image.sortOrder };
  }

  /**
   * A listing card always makes exactly one availability check, whether or
   * not the product has variants — for a variant product this checks only
   * the *first* variant, a representative signal rather than an aggregate
   * across every variant (which would multiply reads per card). The
   * product detail page (`toDetail`) checks every variant individually;
   * see README's Known limitations for this tradeoff.
   */
  private representativeAvailabilityRequest(productId: string, data: ProductDoc): AvailabilityRequest {
    if (data.hasVariants && data.variants.length > 0) {
      const variant = data.variants[0]!;
      return {
        productId,
        variantId: variant.id,
        allowBackorder: variant.allowBackorder,
        trackInventory: variant.trackInventory,
        lowStockThreshold: variant.lowStockThreshold,
      };
    }
    return {
      productId,
      variantId: null,
      allowBackorder: data.allowBackorder,
      trackInventory: data.trackInventory,
      lowStockThreshold: data.lowStockThreshold,
    };
  }

  private async toSummaries(docs: readonly QueryDocumentSnapshot[]): Promise<PublicProductSummary[]> {
    if (docs.length === 0) return [];
    const entries = docs.map((doc) => ({ id: doc.id, data: doc.data() as ProductDoc }));

    const [brandRefs, categoryRefs, availabilities] = await Promise.all([
      this.resolveBrandRefs(entries.map((entry) => entry.data.brandId)),
      this.resolveCategoryRefs(entries.map((entry) => entry.data.primaryCategoryId)),
      this.availability.getAvailabilityForMany(entries.map((entry) => this.representativeAvailabilityRequest(entry.id, entry.data))),
    ]);

    return Promise.all(entries.map((entry, index) => this.toSummary(entry.id, entry.data, brandRefs, categoryRefs, availabilities[index]!)));
  }

  private async toSummary(
    id: string,
    data: ProductDoc,
    brandRefs: Map<string, PublicBrandRef>,
    categoryRefs: Map<string, PublicCategoryRef>,
    availability: PublicAvailability,
  ): Promise<PublicProductSummary> {
    const primaryImageDoc = data.images.find((image) => image.isPrimary) ?? data.images[0];
    const primaryImage = primaryImageDoc ? await this.resolveImage(primaryImageDoc) : null;

    let displayPrice = data.basePrice;
    let compareAtPrice = data.compareAtPrice;
    if (data.hasVariants && data.variants.length > 0) {
      const cheapest = data.variants.reduce((min, variant) =>
        (variant.priceOverride ?? data.basePrice) < (min.priceOverride ?? data.basePrice) ? variant : min,
      );
      displayPrice = cheapest.priceOverride ?? data.basePrice;
      compareAtPrice = cheapest.compareAtPriceOverride ?? data.compareAtPrice;
    }

    return {
      id,
      slug: data.slug,
      name: data.name,
      shortDescription: data.shortDescription,
      brand: data.brandId ? (brandRefs.get(data.brandId) ?? null) : null,
      // Falls back to a generic ref rather than throwing/disappearing if the
      // primary category was deactivated after this product was published —
      // see README's Known limitations for why deactivating a category
      // doesn't cascade to hide its products.
      primaryCategory: categoryRefs.get(data.primaryCategoryId) ?? { name: "Uncategorized", slug: data.primaryCategoryId },
      productType: data.productType,
      tags: data.tags ?? [],
      featured: data.featured,
      primaryImage,
      displayPrice,
      compareAtPrice,
      hasVariants: data.hasVariants,
      availability,
      createdAt: data.createdAt.toDate(),
    };
  }

  private async toDetail(doc: QueryDocumentSnapshot): Promise<PublicProduct> {
    const data = doc.data() as ProductDoc;
    const id = doc.id;

    const [brandRefs, categoryRefs, images, variantAvailabilities, productAvailability] = await Promise.all([
      this.resolveBrandRefs([data.brandId]),
      this.resolveCategoryRefs([data.primaryCategoryId, ...data.additionalCategoryIds]),
      Promise.all(data.images.map((image) => this.resolveImage(image))),
      this.availability.getAvailabilityForMany(
        data.variants.map((variant) => ({
          productId: id,
          variantId: variant.id,
          allowBackorder: variant.allowBackorder,
          trackInventory: variant.trackInventory,
          lowStockThreshold: variant.lowStockThreshold,
        })),
      ),
      data.hasVariants
        ? Promise.resolve(null)
        : this.availability.getAvailability({
            productId: id,
            variantId: null,
            allowBackorder: data.allowBackorder,
            trackInventory: data.trackInventory,
            lowStockThreshold: data.lowStockThreshold,
          }),
    ]);

    const variants: PublicVariant[] = data.variants.map((variant, index) => ({
      id: variant.id,
      sku: variant.sku,
      attributeSelections: variant.attributeSelections,
      price: variant.priceOverride ?? data.basePrice,
      compareAtPrice: variant.compareAtPriceOverride ?? data.compareAtPrice,
      weightGrams: variant.weightGramsOverride ?? data.weightGrams,
      availability: variantAvailabilities[index]!,
    }));

    // A variant product is "in stock" if any variant is; "low stock" if at
    // least one in-stock variant is individually low — never claims the
    // whole product is available when every variant is actually out.
    const availability: PublicAvailability = data.hasVariants
      ? {
          inStock: variants.some((variant) => variant.availability.inStock),
          lowStock: variants.some((variant) => variant.availability.inStock && variant.availability.lowStock),
        }
      : productAvailability!;

    return {
      id,
      slug: data.slug,
      name: data.name,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      brand: data.brandId ? (brandRefs.get(data.brandId) ?? null) : null,
      primaryCategory: categoryRefs.get(data.primaryCategoryId) ?? { name: "Uncategorized", slug: data.primaryCategoryId },
      additionalCategories: data.additionalCategoryIds
        .map((categoryId) => categoryRefs.get(categoryId))
        .filter((ref): ref is PublicCategoryRef => ref !== undefined),
      productType: data.productType,
      tags: data.tags ?? [],
      featured: data.featured,
      sku: data.sku,
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice,
      weightGrams: data.weightGrams,
      dimensions: data.dimensions,
      images,
      hasVariants: data.hasVariants,
      variants,
      attributes: data.attributes
        ? {
            coffee: data.attributes.coffee
              ? {
                  ...data.attributes.coffee,
                  roastDate: data.attributes.coffee.roastDate?.toDate(),
                  bestBeforeDate: data.attributes.coffee.bestBeforeDate?.toDate(),
                }
              : undefined,
            equipment: data.attributes.equipment,
          }
        : undefined,
      availability,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      createdAt: data.createdAt.toDate(),
    };
  }
}
