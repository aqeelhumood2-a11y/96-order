import { describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import { createOrder, type CheckoutInput } from "@/services/checkout/create-order";
import { createMockCheckoutDeps, futureIsoDate, seedCart } from "./test-helpers";

function baseInput(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    cartId: "cart-1",
    idempotencyKey: "idem-1",
    customer: { fullName: "Ahmed Ali", mobile: "36001234", email: "ahmed@example.com" },
    fulfillmentMethod: "pickup",
    schedule: { date: futureIsoDate(), timeWindow: "10:00-12:00" },
    paymentMethod: "cash",
    ...overrides,
  };
}

describe("createOrder", () => {
  it("creates a confirmed cash order, reserves inventory, clears the cart, and sends a confirmation email", async () => {
    const deps = createMockCheckoutDeps();
    await seedCart(deps, 2);

    const result = await createOrder(baseInput(), deps);

    expect(result.order.paymentStatus).toBe("cash_pending");
    expect(result.order.status).toBe("confirmed");
    expect(result.paymentRedirectUrl).toBeUndefined();
    expect(deps.orders.create).toHaveBeenCalledTimes(1);
    expect(deps.inventory.reservations.reserve).toHaveBeenCalledTimes(1);
    expect(deps.inventory.reservations.reserve).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: result.order.id, productId: "product-1", quantity: 2, allowBackorder: false }),
    );
    expect(deps.payments.payments.create).toHaveBeenCalledWith(expect.objectContaining({ method: "cash", status: "cash_pending" }));
    expect(deps.email.email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "ahmed@example.com", template: "order_confirmation" }));
    expect(deps.idempotency.complete).toHaveBeenCalledWith("checkout", "idem-1", result.order.id);

    const clearedCart = await deps.cart.carts.findById("cart-1");
    expect(clearedCart?.lines).toHaveLength(0);
  });

  it("creates a pending_payment tap order and returns the Tap redirect URL", async () => {
    const deps = createMockCheckoutDeps();
    await seedCart(deps, 1);

    const result = await createOrder(
      baseInput({ paymentMethod: "tap", returnUrl: "https://example.com/checkout/success", fulfillmentMethod: "pickup" }),
      deps,
    );

    expect(result.order.status).toBe("pending_payment");
    expect(result.order.paymentStatus).toBe("pending");
    expect(result.paymentRedirectUrl).toBe("https://pay.example/chg_1");
    expect(deps.payments.provider.createCharge).toHaveBeenCalledTimes(1);
  });

  it("rejects a tap checkout without a return URL before doing anything else", async () => {
    const deps = createMockCheckoutDeps();
    await expect(createOrder(baseInput({ paymentMethod: "tap" }), deps)).rejects.toThrow(ValidationError);
    expect(deps.idempotency.begin).not.toHaveBeenCalled();
  });

  it("rejects an empty cart and marks the idempotency key failed", async () => {
    const deps = createMockCheckoutDeps();
    await expect(createOrder(baseInput(), deps)).rejects.toThrow(ValidationError);
    expect(deps.idempotency.fail).toHaveBeenCalledWith("checkout", "idem-1");
    expect(deps.orders.create).not.toHaveBeenCalled();
  });

  it("rejects a cart with blocking issues (a product that became unavailable after being added)", async () => {
    const deps = createMockCheckoutDeps();
    await seedCart(deps, 1);
    deps.cart.products.findById = async () => null;

    await expect(createOrder(baseInput(), deps)).rejects.toThrow(ValidationError);
    expect(deps.orders.create).not.toHaveBeenCalled();
  });

  it("returns the existing order unchanged on a duplicate submission of an already-completed checkout", async () => {
    const deps = createMockCheckoutDeps();
    const existingOrder = { id: "order-existing" } as Order;
    deps.idempotency.begin = vi.fn().mockResolvedValue({
      record: { key: "idem-1", scope: "checkout", status: "completed", resultRef: "order-existing", createdAt: new Date(), updatedAt: new Date() },
      created: false,
    });
    deps.orders.findById = vi.fn().mockResolvedValue(existingOrder);

    const result = await createOrder(baseInput(), deps);

    expect(result.order).toBe(existingOrder);
    expect(deps.orders.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate submission that is still in progress", async () => {
    const deps = createMockCheckoutDeps();
    deps.idempotency.begin = vi.fn().mockResolvedValue({
      record: { key: "idem-1", scope: "checkout", status: "in_progress", createdAt: new Date(), updatedAt: new Date() },
      created: false,
    });

    await expect(createOrder(baseInput(), deps)).rejects.toThrow(ConflictError);
    expect(deps.orders.create).not.toHaveBeenCalled();
  });

  it("cancels the order and rethrows when inventory reservation fails", async () => {
    const deps = createMockCheckoutDeps();
    await seedCart(deps, 1);
    deps.inventory.reservations.reserve = vi.fn().mockRejectedValue(new ConflictError("Not enough available stock to reserve this quantity."));

    await expect(createOrder(baseInput(), deps)).rejects.toThrow(ConflictError);

    expect(deps.orders.update).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ status: "cancelled" }), 1);
    expect(deps.idempotency.fail).toHaveBeenCalledWith("checkout", "idem-1");
    expect(deps.payments.payments.create).not.toHaveBeenCalled();
  });

  it("retries with a new order number when one collides, and still succeeds", async () => {
    const deps = createMockCheckoutDeps();
    await seedCart(deps, 1);
    deps.orders.create = vi
      .fn()
      .mockRejectedValueOnce(new ConflictError("Order number collision."))
      .mockResolvedValueOnce(undefined);

    const result = await createOrder(baseInput(), deps);

    expect(deps.orders.create).toHaveBeenCalledTimes(2);
    expect(result.order.orderNumber).toBeTruthy();
  });
});
