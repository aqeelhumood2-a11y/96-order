"use server";

import { headers } from "next/headers";
import { STOREFRONT_RATE_LIMITS } from "@/config/rate-limits";
import { RateLimitedError } from "@/core/errors";
import type { PublicOrderView } from "@/core/orders/public-view";
import { runAction, type ActionResult } from "@/lib/action-result";
import { trackOrder, type TrackOrderInput } from "@/services/orders/track-order";
import { defaultRateLimiter } from "@/services/rate-limiting/default-rate-limiter";

async function clientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Rate-limited before `trackOrder` itself runs — order tracking is
 * exactly the kind of public, no-auth endpoint an enumeration attempt
 * would target (trying many order numbers or many mobile/email guesses
 * against a known one), so throttling by IP here is the other half of
 * `trackOrder`'s own "always the same generic error" defense.
 */
export async function trackOrderAction(input: TrackOrderInput): Promise<ActionResult<PublicOrderView>> {
  return runAction(async () => {
    const ip = await clientIp();
    const limit = STOREFRONT_RATE_LIMITS.trackOrderByIp;
    const rateLimit = await defaultRateLimiter.consume(`track-order:ip:${ip}`, limit.limit, limit.windowSeconds);
    if (!rateLimit.allowed) {
      throw new RateLimitedError("Too many attempts. Please try again shortly.", { details: { retryAfterSeconds: rateLimit.retryAfterSeconds } });
    }

    return trackOrder(input);
  });
}
