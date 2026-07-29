import "server-only";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type {
  CoffeeAttributes,
  Product,
  ProductAttributes,
  ProductImage,
  ProductVariant,
} from "@/core/catalog/entities";
import { normalizeCatalogCode } from "@/core/catalog/rules";
import { ConflictError, NotFoundError } from "@/core/errors";
import type { ListProductsRequest, ProductRepository } from "@/core/interfaces/product-repository";
import type { Page } from "@/core/interfaces/repository";
import { getAdminFirestore } from "../admin";
import { diffUniqueKeyClaims, reconcileUniqueKeys, type UniqueKeyClaim } from "./catalog-unique-keys";

const COLLECTION = "products";
const OWNER_KIND = "product";

interface CoffeeAttributesDoc extends Omit<CoffeeAttributes, "roastDate" | "bestBeforeDate"> {
  roastDate?: Timestamp;
  bestBeforeDate?: Timestamp;
}

interface ProductImageDoc extends Omit<ProductImage, "uploadedAt"> {
  uploadedAt: Timestamp;
}

interface ProductDoc extends Omit<Product, "id" | "createdAt" | "updatedAt" | "images" | "attributes"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  images: ProductImageDoc[];
  attributes?: Omit<ProductAttributes, "coffee"> & { coffee?: CoffeeAttributesDoc };
}

function toDomain(doc: QueryDocumentSnapshot): Product {
  const data = doc.data() as ProductDoc;
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription,
    fullDescription: data.fullDescription,
    brandId: data.brandId,
    primaryCategoryId: data.primaryCategoryId,
    additionalCategoryIds: data.additionalCategoryIds ?? [],
    productType: data.productType,
    status: data.status,
    visibility: data.visibility,
    featured: data.featured,
    sku: data.sku,
    barcode: data.barcode,
    basePrice: data.basePrice,
    compareAtPrice: data.compareAtPrice,
    costPrice: data.costPrice,
    taxClass: data.taxClass,
    trackInventory: data.trackInventory,
    allowBackorder: data.allowBackorder,
    lowStockThreshold: data.lowStockThreshold,
    weightGrams: data.weightGrams,
    dimensions: data.dimensions,
    tags: data.tags ?? [],
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    hasVariants: data.hasVariants,
    variants: data.variants ?? [],
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
    images: (data.images ?? []).map((image) => ({ ...image, uploadedAt: image.uploadedAt.toDate() })),
    version: data.version,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
}

function toDoc(product: Product): ProductDoc {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    brandId: product.brandId,
    primaryCategoryId: product.primaryCategoryId,
    additionalCategoryIds: product.additionalCategoryIds,
    productType: product.productType,
    status: product.status,
    visibility: product.visibility,
    featured: product.featured,
    sku: product.sku,
    barcode: product.barcode,
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    costPrice: product.costPrice,
    taxClass: product.taxClass,
    trackInventory: product.trackInventory,
    allowBackorder: product.allowBackorder,
    lowStockThreshold: product.lowStockThreshold,
    weightGrams: product.weightGrams,
    dimensions: product.dimensions,
    tags: product.tags,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    hasVariants: product.hasVariants,
    variants: product.variants,
    attributes: product.attributes
      ? {
          coffee: product.attributes.coffee
            ? {
                ...product.attributes.coffee,
                roastDate: product.attributes.coffee.roastDate
                  ? Timestamp.fromDate(product.attributes.coffee.roastDate)
                  : undefined,
                bestBeforeDate: product.attributes.coffee.bestBeforeDate
                  ? Timestamp.fromDate(product.attributes.coffee.bestBeforeDate)
                  : undefined,
              }
            : undefined,
          equipment: product.attributes.equipment,
        }
      : undefined,
    images: product.images.map((image) => ({ ...image, uploadedAt: Timestamp.fromDate(image.uploadedAt) })),
    version: product.version,
    createdAt: Timestamp.fromDate(product.createdAt),
    updatedAt: Timestamp.fromDate(product.updatedAt),
    createdBy: product.createdBy,
    updatedBy: product.updatedBy,
  };
}

/**
 * Every unique key this product currently occupies: its slug, its own SKU
 * (kept even for variant products — see the README's product model
 * section), its barcode if set, and every variant's SKU/barcode. SKU and
 * barcode share one global namespace each across the whole catalog
 * (product-level and variant-level values can never collide with each
 * other), while slugs are scoped to products only.
 */
function productClaims(slug: string, sku: string, barcode: string | undefined, variants: readonly ProductVariant[]): UniqueKeyClaim[] {
  const claims: UniqueKeyClaim[] = [
    { type: "product-slug", value: slug },
    { type: "sku", value: normalizeCatalogCode(sku) },
  ];
  if (barcode) claims.push({ type: "barcode", value: normalizeCatalogCode(barcode) });
  for (const variant of variants) {
    claims.push({ type: "sku", value: normalizeCatalogCode(variant.sku) });
    if (variant.barcode) claims.push({ type: "barcode", value: normalizeCatalogCode(variant.barcode) });
  }
  return claims;
}

export class FirestoreProductRepository implements ProductRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Product | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async list(request: ListProductsRequest): Promise<Page<Product>> {
    let query = this.db().collection(COLLECTION).orderBy("createdAt", "desc").limit(request.limit);

    if (request.status) {
      query = query.where("status", "==", request.status);
    }
    if (request.categoryId) {
      query = query.where("primaryCategoryId", "==", request.categoryId);
    }
    if (request.brandId) {
      query = query.where("brandId", "==", request.brandId);
    }

    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const items = snap.docs.map(toDomain);
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async create(product: Product): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(product.id);
    await this.db().runTransaction(async (transaction) => {
      await reconcileUniqueKeys(
        this.db(),
        transaction,
        product.id,
        OWNER_KIND,
        productClaims(product.slug, product.sku, product.barcode, product.variants),
      );
      transaction.set(ref, toDoc(product));
    });
  }

  async update(id: string, patch: Partial<Product>, expectedVersion: number): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundError("Product not found.");

      const current = toDomain(snap as QueryDocumentSnapshot);
      if (current.version !== expectedVersion) {
        throw new ConflictError("This product was changed by someone else. Reload and try again.");
      }

      const nextSlug = patch.slug ?? current.slug;
      const nextSku = patch.sku ?? current.sku;
      const nextBarcode = "barcode" in patch ? patch.barcode : current.barcode;
      const nextVariants = patch.variants ?? current.variants;

      const { toClaim, toRelease } = diffUniqueKeyClaims(
        productClaims(current.slug, current.sku, current.barcode, current.variants),
        productClaims(nextSlug, nextSku, nextBarcode, nextVariants),
      );
      if (toClaim.length > 0 || toRelease.length > 0) {
        await reconcileUniqueKeys(this.db(), transaction, id, OWNER_KIND, toClaim, toRelease);
      }

      // `ignoreUndefinedProperties` (see infrastructure/firebase/admin.ts) makes
      // the Admin SDK silently drop any field whose value is `undefined` from
      // a write — which would leave a stale barcode in place instead of
      // clearing it. `FieldValue.delete()` is the explicit way to actually
      // remove a field, so an intentional clear (barcode present in `patch`
      // but set to `undefined`) needs this special case; every other field
      // either can't be cleared this way or isn't a uniqueness-tracked value
      // like barcode is.
      const clearingBarcode = "barcode" in patch && patch.barcode === undefined && current.barcode !== undefined;
      const docPatch = toDoc({ ...current, ...patch } as Product);
      transaction.update(ref, {
        ...docPatch,
        ...(clearingBarcode ? { barcode: FieldValue.delete() } : {}),
        version: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async archive(id: string, archivedBy: string): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError("Product not found.");

    await ref.update({
      status: "archived",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: archivedBy,
      version: FieldValue.increment(1),
    });
  }

  /**
   * Sums two separate `count()` queries (Firestore has no single query that
   * expresses "primaryCategoryId == X OR additionalCategoryIds contains X"
   * with an aggregate count) rather than short-circuiting on whichever is
   * checked first — an earlier version returned only the primary count
   * whenever it was nonzero, silently ignoring products that reference the
   * category only via `additionalCategoryIds`. A product's own
   * `additionalCategoryIds` is validated to never include its own
   * `primaryCategoryId` (see `services/catalog/create-product.ts`), so the
   * two queries can't double-count the same product.
   */
  async countByCategory(categoryId: string): Promise<number> {
    const [primary, additional] = await Promise.all([
      this.db().collection(COLLECTION).where("primaryCategoryId", "==", categoryId).count().get(),
      this.db().collection(COLLECTION).where("additionalCategoryIds", "array-contains", categoryId).count().get(),
    ]);
    return primary.data().count + additional.data().count;
  }

  async countByBrand(brandId: string): Promise<number> {
    const snap = await this.db().collection(COLLECTION).where("brandId", "==", brandId).count().get();
    return snap.data().count;
  }
}
