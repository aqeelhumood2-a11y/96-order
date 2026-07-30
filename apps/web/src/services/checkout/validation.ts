import { isValidEmail } from "@/core/customer/email";
import { normalizeBahrainMobile } from "@/core/customer/phone";
import { isValidDeliveryAddress } from "@/core/delivery/rules";
import type { DeliveryAddress, FulfillmentMethod, FulfillmentSchedule } from "@/core/delivery/entities";
import type { OrderCustomerSnapshot, OrderFulfillment } from "@/core/orders/entities";
import { isScheduleAvailable } from "@/core/scheduling/rules";
import { ValidationError } from "@/core/errors";
import { PICKUP_LOCATION } from "@/config/pickup";

export interface CheckoutCustomerInput {
  fullName: string;
  mobile: string;
  email: string;
  companyName?: string;
  note?: string;
}

/** Server-side validation/normalization for the customer info block — never trust the browser's own idea of a normalized phone number or a lowercased email. */
export function validateCustomer(input: CheckoutCustomerInput): OrderCustomerSnapshot {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    throw new ValidationError("Please enter your full name.");
  }

  const mobile = normalizeBahrainMobile(input.mobile);
  if (!mobile) {
    throw new ValidationError("Please enter a valid Bahrain mobile number.");
  }

  if (!isValidEmail(input.email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  return {
    fullName,
    mobile,
    email: input.email.trim().toLowerCase(),
    companyName: input.companyName?.trim() || undefined,
    note: input.note?.trim() || undefined,
  };
}

export interface CheckoutFulfillmentInput {
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: DeliveryAddress;
  pickupInstructions?: string;
  schedule: FulfillmentSchedule;
}

/** Re-derives slot availability from `now` rather than trusting a client-submitted `available: true` — see `core/scheduling/rules.ts#isScheduleAvailable`. */
export function validateFulfillment(input: CheckoutFulfillmentInput, now: Date): OrderFulfillment {
  if (!isScheduleAvailable(now, input.fulfillmentMethod, input.schedule)) {
    throw new ValidationError("The selected delivery/pickup slot is no longer available. Please choose another.");
  }

  if (input.fulfillmentMethod === "delivery") {
    if (!input.deliveryAddress || !isValidDeliveryAddress(input.deliveryAddress)) {
      throw new ValidationError("Please provide a complete delivery address.");
    }
    return { method: "delivery", address: input.deliveryAddress, schedule: input.schedule };
  }

  return {
    method: "pickup",
    pickup: { ...PICKUP_LOCATION, instructions: input.pickupInstructions?.trim() || undefined },
    schedule: input.schedule,
  };
}
