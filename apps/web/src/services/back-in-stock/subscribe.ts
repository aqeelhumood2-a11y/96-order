import { randomBytes } from "node:crypto";
import { CUSTOMER_RATE_LIMITS } from "@/config/customer-auth";
import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import { subscribeBackInStockSchema } from "@/core/back-in-stock/schemas";
import { NotFoundError, RateLimitedError, ValidationError } from "@/core/errors";
import { defaultBackInStockDeps, type BackInStockDeps } from "./dependencies";

export interface SubscribeBackInStockRequest {
  email: string;
  productId: string;
  variantId: string | null;
  ip: string;
  customerUid?: string;
}

/**
 * Guests and signed-in customers share one code path — `customerUid` is
 * optional and purely denormalized onto the row for
 * `/account/notifications`'s "my subscriptions" query; the actual identity
 * this feature dedupes and notifies against is always the email.
 */
export async function subscribeToBackInStock(input: SubscribeBackInStockRequest, deps: BackInStockDeps = defaultBackInStockDeps): Promise<BackInStockSubscription> {
  const ipLimit = CUSTOMER_RATE_LIMITS.backInStockSubscribeByIp;
  const ipResult = await deps.rateLimiter.consume(`back-in-stock-subscribe:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
  if (!ipResult.allowed) {
    throw new RateLimitedError("Too many requests. Try again shortly.", { details: { retryAfterSeconds: ipResult.retryAfterSeconds } });
  }

  const parsed = subscribeBackInStockSchema.parse({ email: input.email, productId: input.productId, variantId: input.variantId });
  const email = parsed.email.trim().toLowerCase();

  const product = await deps.products.findById(parsed.productId);
  if (!product) {
    throw new NotFoundError("This product is no longer available.");
  }

  const variant = parsed.variantId ? product.variants.find((candidate) => candidate.id === parsed.variantId) : undefined;
  if (parsed.variantId && !variant) {
    throw new ValidationError("The selected option is no longer available.");
  }

  const availability = variant?.availability ?? product.availability;
  if (availability.inStock) {
    throw new ValidationError("This item is already in stock.");
  }

  const subscription: BackInStockSubscription = {
    id: "",
    customerUid: input.customerUid ?? null,
    email,
    productId: parsed.productId,
    variantId: parsed.variantId,
    status: "pending",
    unsubscribeToken: randomBytes(16).toString("hex"),
    createdAt: new Date(),
    notifiedAt: null,
  };

  const saved = await deps.subscriptions.subscribe(subscription);
  await deps.auditLogs.record({
    type: "back_in_stock_subscribed",
    actorUid: input.customerUid ?? null,
    actorEmail: email,
    metadata: { productId: parsed.productId, variantId: parsed.variantId },
  });

  return saved;
}
