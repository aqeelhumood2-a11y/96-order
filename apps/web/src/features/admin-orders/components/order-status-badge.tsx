import type { OrderStatus } from "@/core/orders/entities";
import type { PaymentStatus } from "@/core/payments/entities";
import { Badge, type BadgeProps } from "@/ui/primitives/badge";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<OrderStatus, BadgeProps["variant"]> = {
  pending_payment: "warning",
  confirmed: "accent",
  preparing: "accent",
  ready: "accent",
  out_for_delivery: "accent",
  completed: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  cash_pending: "Cash on delivery/pickup",
  cash_confirmed: "Cash confirmed",
};

const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, BadgeProps["variant"]> = {
  pending: "warning",
  authorized: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "danger",
  refunded: "neutral",
  cash_pending: "warning",
  cash_confirmed: "success",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_STATUS_VARIANTS[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
