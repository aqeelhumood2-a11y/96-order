import { vi } from "vitest";
import type { Product } from "@/core/catalog/entities";
import type { CartDeps } from "@/services/cart/dependencies";

export function createMockCartDeps(): CartDeps {
  return {
    carts: {
      findById: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    products: {
      findById: vi.fn().mockResolvedValue(null),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      countByCategory: vi.fn(),
      countByBrand: vi.fn(),
    },
    inventory: {
      findByProductAndVariant: vi.fn().mockResolvedValue(null),
      listByProduct: vi.fn(),
      listLowStock: vi.fn(),
      ensureExists: vi.fn(),
      adjust: vi.fn(),
    },
    images: {
      upload: vi.fn(),
      delete: vi.fn(),
      getDownloadUrl: vi.fn().mockResolvedValue("https://example.com/image.jpg"),
    },
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date();
  return {
    id: "product-1",
    name: "Ethiopia Yirgacheffe",
    slug: "ethiopia-yirgacheffe",
    brandId: null,
    primaryCategoryId: "cat-1",
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "active",
    visibility: "visible",
    featured: false,
    sku: "ETH-1",
    basePrice: 1899,
    trackInventory: false,
    allowBackorder: false,
    tags: [],
    hasVariants: false,
    variants: [],
    images: [],
    searchTokens: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "test",
    updatedBy: "test",
    ...overrides,
  };
}
