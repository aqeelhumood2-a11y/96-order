import { vi } from "vitest";
import type { Cart } from "@/core/cart/entities";
import type { CheckoutDeps } from "@/services/checkout/dependencies";
import { addToCart } from "@/services/cart/add-to-cart";
import { createMockCartDeps, makeProduct } from "../cart/test-helpers";

export function createMockCheckoutDeps(): CheckoutDeps {
  const cart = createMockCartDeps();

  return {
    cart,
    orders: {
      findById: vi.fn().mockResolvedValue(null),
      findByOrderNumber: vi.fn().mockResolvedValue(null),
      findByIdempotencyKey: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      listByCustomer: vi.fn().mockResolvedValue([]),
    },
    orderEvents: { record: vi.fn().mockResolvedValue(undefined), listByOrder: vi.fn().mockResolvedValue([]) },
    customers: {
      findById: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      upsert: vi.fn(async (id, fold) => fold(null)),
    },
    idempotency: {
      begin: vi.fn().mockResolvedValue({
        record: { key: "idem-1", scope: "checkout", status: "in_progress", createdAt: new Date(), updatedAt: new Date() },
        created: true,
      }),
      complete: vi.fn().mockResolvedValue(undefined),
      fail: vi.fn().mockResolvedValue(undefined),
    },
    inventory: {
      reservations: {
        reserve: vi.fn(async (input) => ({
          id: `${input.orderId}:${input.productId}:${input.variantId ?? "-"}`,
          orderId: input.orderId,
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
          status: "reserved" as const,
          expiresAt: input.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        release: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        listByOrder: vi.fn().mockResolvedValue([]),
        listExpired: vi.fn().mockResolvedValue([]),
      },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    },
    payments: {
      payments: {
        findById: vi.fn(),
        findByOrderId: vi.fn(),
        findByProviderReference: vi.fn(),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      },
      webhookEvents: { findById: vi.fn(), record: vi.fn(), markProcessed: vi.fn() },
      provider: {
        createCharge: vi.fn().mockResolvedValue({ providerReference: "chg_1", redirectUrl: "https://pay.example/chg_1" }),
        verifyWebhookSignature: vi.fn(),
        parseWebhookEvent: vi.fn(),
        retrieveCharge: vi.fn(),
      },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    },
    email: {
      email: { send: vi.fn().mockResolvedValue({ sent: true }) },
      outbox: {
        enqueue: vi.fn().mockResolvedValue({
          id: "outbox-1",
          to: "shopper@example.com",
          template: "order_confirmation",
          data: {},
          status: "pending",
          attempts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        markSent: vi.fn().mockResolvedValue(undefined),
        markFailed: vi.fn().mockResolvedValue(undefined),
      },
    },
    auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    pricing: {
      coupons: {
        findByCode: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
        redeem: vi.fn().mockResolvedValue(true),
        countRedemptionsByCustomer: vi.fn().mockResolvedValue(0),
      },
      promotions: {
        findById: vi.fn().mockResolvedValue(null),
        listActive: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      },
      orders: {
        findById: vi.fn().mockResolvedValue(null),
        findByOrderNumber: vi.fn().mockResolvedValue(null),
        findByIdempotencyKey: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
        listByCustomer: vi.fn().mockResolvedValue([]),
      },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
      rateLimiter: { consume: vi.fn().mockResolvedValue({ allowed: true }) },
    },
  };
}

/**
 * Seeds `cart-1` with one line for a $50.00-equivalent (5000 fils) product
 * at the given quantity, using the real cart services so pricing/
 * snapshotting behaves exactly as it would in production. `trackInventory:
 * true` (with no seeded `InventoryRecord`, so availability is still
 * unconstrained — see `computeAvailability`'s `!record` case) so these
 * tests actually exercise the reservation path rather than silently
 * skipping it the way an untracked product would.
 */
export async function seedCart(deps: CheckoutDeps, quantity = 2): Promise<void> {
  let stored: Cart | null = null;
  deps.cart.carts.findById = async () => stored;
  deps.cart.carts.upsert = async (cart) => {
    stored = cart;
  };
  deps.cart.products.findById = async (id) => makeProduct({ id, basePrice: 5000, trackInventory: true });

  await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity }, deps.cart);
}

export function futureIsoDate(daysAhead = 2): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
