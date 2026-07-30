import type { CurrencyCode, Money } from "@/core/money/money";
import type { FulfillmentMethod, FulfillmentSchedule } from "@/core/delivery/entities";
import type { Order, OrderStatus } from "./entities";
import { fulfillmentMethodOf } from "./entities";
import type { PaymentStatus } from "@/core/payments/entities";

/**
 * A public-safe rendering of `PaymentStatus` — collapses the internal
 * cash-vs-tap distinction (`cash_pending`/`pending` both just mean "we're
 * still waiting") into wording a shopper can act on, and never surfaces
 * the raw enum value itself. See README's Order tracking section for why
 * this exists as its own mapping rather than exposing `PaymentStatus`
 * directly on the public view.
 */
const PUBLIC_PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  authorized: "Payment processing",
  paid: "Paid",
  failed: "Payment failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  cash_pending: "Pay on delivery/pickup",
  cash_confirmed: "Paid (cash)",
};

export function publicPaymentStatusLabel(status: PaymentStatus): string {
  return PUBLIC_PAYMENT_STATUS_LABELS[status];
}

export interface PublicOrderLineSummary {
  productName: string;
  quantity: number;
}

/**
 * Everything (and *only* what) a verified shopper is shown when tracking
 * their own order — deliberately excludes the internal Firestore id,
 * `idempotencyKey`, full customer snapshot, exact delivery
 * address/pickup instructions, internal notes, and any audit/version
 * data. See README's Order tracking section for the full "public-safe
 * fields only" list this mirrors.
 */
export interface PublicOrderView {
  orderNumber: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  schedule: FulfillmentSchedule;
  items: PublicOrderLineSummary[];
  grandTotal: Money;
  currency: CurrencyCode;
  paymentStatusLabel: string;
  createdAt: Date;
}

export function buildPublicOrderView(order: Order): PublicOrderView {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: fulfillmentMethodOf(order.fulfillment),
    schedule: order.fulfillment.schedule,
    items: order.lines.map((line) => ({ productName: line.productName, quantity: line.quantity })),
    grandTotal: order.grandTotal,
    currency: order.currency,
    paymentStatusLabel: publicPaymentStatusLabel(order.paymentStatus),
    createdAt: order.createdAt,
  };
}
