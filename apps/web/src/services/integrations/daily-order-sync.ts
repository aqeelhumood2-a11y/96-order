import { ORDER_SYNC_MAX_RESULTS } from "@/config/jobs";
import type { Money } from "@/core/money/money";
import type { FulfillmentMethod } from "@/core/delivery/entities";
import type { OrderStatus } from "@/core/orders/entities";
import type { PaymentMethod, PaymentStatus } from "@/core/payments/entities";
import { defaultOrderTrackingDeps, type OrderTrackingDeps } from "@/services/orders/dependencies";

/**
 * The external-ERP-facing shape of an order — deliberately not `Order`
 * itself, so a Firestore schema change on `Order` can never silently
 * change what an external system already integrated against receives.
 * Includes what an ERP actually needs to fulfill/reconcile an order
 * (customer contact info, line items, totals, fulfillment details) —
 * unlike `AdminAssistantContext` (aggregate-only, see that type's doc
 * comment), this is a legitimate, different consumer.
 */
export interface OrderSyncRow {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentMethod: FulfillmentMethod;
  customer: { fullName: string; mobile: string; email: string };
  lines: { sku: string; productName: string; quantity: number; unitPrice: Money; lineTotal: Money }[];
  subtotal: Money;
  shippingFee: Money;
  discountTotal: Money;
  grandTotal: Money;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSyncFeed {
  from: string;
  to: string;
  count: number;
  orders: OrderSyncRow[];
}

/**
 * Read-only feed of every order created in `[from, to]`, oldest first —
 * meant to be polled daily (or more often) by an external ERP/inventory
 * system via `/api/integrations/orders/sync` (see `lib/verify-job-secret.ts`
 * for its auth). Bounded by `ORDER_SYNC_MAX_RESULTS`: a caller syncing more
 * often than once a day, or a single day with more orders than that limit,
 * should page by narrowing `from`/`to` rather than relying on a cursor this
 * endpoint doesn't expose — see README's Known limitations.
 */
export async function getOrderSyncFeed(from: Date, to: Date, deps: OrderTrackingDeps = defaultOrderTrackingDeps): Promise<OrderSyncFeed> {
  const page = await deps.orders.list({ dateFrom: from, dateTo: to, sort: "createdAt", direction: "asc", limit: ORDER_SYNC_MAX_RESULTS });

  const orders: OrderSyncRow[] = page.items.map((order) => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fulfillmentMethod: order.fulfillment.method,
    customer: { fullName: order.customer.fullName, mobile: order.customer.mobile, email: order.customer.email },
    lines: order.lines.map((line) => ({ sku: line.sku, productName: line.productName, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: line.lineTotal })),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discountTotal: order.discountTotal,
    grandTotal: order.grandTotal,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));

  return { from: from.toISOString(), to: to.toISOString(), count: orders.length, orders };
}
