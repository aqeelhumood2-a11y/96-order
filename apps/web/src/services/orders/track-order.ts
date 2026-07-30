import { normalizeBahrainMobile } from "@/core/customer/phone";
import { NotFoundError, ValidationError } from "@/core/errors";
import { buildPublicOrderView, type PublicOrderView } from "@/core/orders/public-view";
import { isValidOrderNumberFormat } from "@/core/orders/rules";
import { defaultOrderTrackingDeps, type OrderTrackingDeps } from "./dependencies";

export interface TrackOrderInput {
  orderNumber: string;
  /** At least one of `mobile`/`email` is required — whichever the shopper provides is checked against the order's own customer snapshot. */
  mobile?: string;
  email?: string;
}

const NOT_FOUND_MESSAGE = "We couldn't find an order matching those details.";

/**
 * Public order tracking — deliberately returns the exact same generic
 * `NotFoundError` for every failure mode (malformed order number, no order
 * with that number, an order that exists but whose mobile/email doesn't
 * match) so a caller can never distinguish "wrong verification factor"
 * from "no such order," which is what makes this resistant to order
 * number enumeration. Rate limiting this endpoint (see `app/api/orders/
 * track/route.ts`) is the other half of that defense — this function only
 * owns the "never a different response shape/message" half.
 */
export async function trackOrder(input: TrackOrderInput, deps: OrderTrackingDeps = defaultOrderTrackingDeps): Promise<PublicOrderView> {
  if (!isValidOrderNumberFormat(input.orderNumber)) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  const mobile = input.mobile ? normalizeBahrainMobile(input.mobile) : null;
  const email = input.email ? input.email.trim().toLowerCase() : null;
  if (!mobile && !email) {
    throw new ValidationError("Please provide your mobile number or email to verify the order.");
  }

  const order = await deps.orders.findByOrderNumber(input.orderNumber);
  if (!order) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  const verified = (mobile !== null && order.customer.mobile === mobile) || (email !== null && order.customer.email === email);
  if (!verified) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }

  return buildPublicOrderView(order);
}
