"use server";

import { headers } from "next/headers";
import { STOREFRONT_RATE_LIMITS } from "@/config/rate-limits";
import { SITE_URL } from "@/config/site";
import type { DeliveryAddress, FulfillmentMethod, FulfillmentSchedule } from "@/core/delivery/entities";
import { RateLimitedError, ValidationError } from "@/core/errors";
import type { PaymentMethod } from "@/core/payments/entities";
import { runAction, type ActionResult } from "@/lib/action-result";
import { peekCartId } from "@/services/cart/cart-session";
import { createOrder } from "@/services/checkout/create-order";
import type { CheckoutCustomerInput } from "@/services/checkout/validation";
import { defaultRateLimiter } from "@/services/rate-limiting/default-rate-limiter";

export interface CheckoutSubmission {
  idempotencyKey: string;
  customer: CheckoutCustomerInput;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: DeliveryAddress;
  pickupInstructions?: string;
  schedule: FulfillmentSchedule;
  paymentMethod: PaymentMethod;
}

export interface CheckoutSubmissionResult {
  orderNumber: string;
  paymentRedirectUrl?: string;
}

async function clientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Public checkout submission — rate-limited by IP before doing anything
 * else (mirrors `services/auth/create-session.ts`'s pattern for the same
 * reason: a public, state-changing endpoint needs its own throttle
 * independent of the checkout use case itself). The actual cart id is
 * resolved from the signed cookie server-side, never trusted from the
 * client; `createOrder` does the rest of the real validation/idempotency
 * work — see its own doc comment.
 */
export async function submitCheckoutAction(input: CheckoutSubmission): Promise<ActionResult<CheckoutSubmissionResult>> {
  return runAction(async () => {
    const ip = await clientIp();
    const limit = STOREFRONT_RATE_LIMITS.checkoutByIp;
    const rateLimit = await defaultRateLimiter.consume(`checkout:ip:${ip}`, limit.limit, limit.windowSeconds);
    if (!rateLimit.allowed) {
      throw new RateLimitedError("Too many checkout attempts. Please try again shortly.", {
        details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
      });
    }

    const cartId = await peekCartId();
    if (!cartId) {
      throw new ValidationError("Your cart is empty.");
    }

    const result = await createOrder({
      cartId,
      idempotencyKey: input.idempotencyKey,
      customer: input.customer,
      fulfillmentMethod: input.fulfillmentMethod,
      deliveryAddress: input.deliveryAddress,
      pickupInstructions: input.pickupInstructions,
      schedule: input.schedule,
      paymentMethod: input.paymentMethod,
      returnUrl: input.paymentMethod === "tap" ? `${SITE_URL}/checkout/success` : undefined,
    });

    return { orderNumber: result.order.orderNumber, paymentRedirectUrl: result.paymentRedirectUrl };
  });
}
