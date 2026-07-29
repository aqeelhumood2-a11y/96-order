import { vi } from "vitest";
import type { Session } from "@/core/auth/entities";
import type { CatalogDeps } from "@/services/catalog/dependencies";

export function createMockCatalogDeps(overrides: Partial<CatalogDeps> = {}): CatalogDeps {
  const deps: CatalogDeps = {
    products: {
      findById: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      archive: vi.fn().mockResolvedValue(undefined),
      countByCategory: vi.fn().mockResolvedValue(0),
      countByBrand: vi.fn().mockResolvedValue(0),
    },
    categories: {
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    brands: {
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    inventory: {
      findByProductAndVariant: vi.fn().mockResolvedValue(null),
      listByProduct: vi.fn().mockResolvedValue([]),
      listLowStock: vi.fn().mockResolvedValue([]),
      ensureExists: vi.fn().mockImplementation(async (productId: string, variantId: string | null) => ({
        id: `${productId}:${variantId ?? "-"}`,
        productId,
        variantId,
        onHand: 0,
        reserved: 0,
        updatedAt: new Date(),
        updatedBy: "system",
      })),
      adjust: vi.fn().mockImplementation(async (input) => ({
        record: {
          id: `${input.productId}:${input.variantId ?? "-"}`,
          productId: input.productId,
          variantId: input.variantId,
          onHand: input.quantityDelta,
          reserved: 0,
          updatedAt: new Date(),
          updatedBy: input.actorId,
        },
        adjustment: {
          id: "adjustment-1",
          inventoryId: `${input.productId}:${input.variantId ?? "-"}`,
          productId: input.productId,
          variantId: input.variantId,
          reason: input.reason,
          quantityDelta: input.quantityDelta,
          onHandBefore: 0,
          onHandAfter: input.quantityDelta,
          note: input.note,
          actorId: input.actorId,
          createdAt: new Date(),
        },
      })),
    },
    inventoryAdjustments: {
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    },
    productImages: {
      upload: vi.fn().mockResolvedValue({ storagePath: "products/p1/img1.jpg", contentType: "image/jpeg", sizeBytes: 100 }),
      delete: vi.fn().mockResolvedValue(undefined),
      getDownloadUrl: vi.fn().mockResolvedValue("https://example.com/download?token=fake"),
    },
    auditLogs: {
      record: vi.fn().mockImplementation(async (entry) => ({ id: "log-1", createdAt: new Date(), ...entry })),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    },
  };

  return { ...deps, ...overrides };
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    uid: "actor-uid",
    email: "actor@example.com",
    roleIds: [],
    effectivePermissions: new Set(),
    ...overrides,
  };
}
