import type { OrderStatus } from "@/core/orders/entities";
import type { PaymentStatus } from "@/core/payments/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Badge, type BadgeProps } from "@/ui/primitives/badge";

const STATUS_VARIANTS: Record<OrderStatus, BadgeProps["variant"]> = {
  pending_payment: "warning",
  confirmed: "accent",
  accepted: "accent",
  preparing: "accent",
  ready: "accent",
  out_for_delivery: "accent",
  completed: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status, locale = DEFAULT_LOCALE }: { status: OrderStatus; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderStatus;
  return <Badge variant={STATUS_VARIANTS[status]}>{dict[status]}</Badge>;
}

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

export function PaymentStatusBadge({ status, locale = DEFAULT_LOCALE }: { status: PaymentStatus; locale?: Locale }) {
  const dict = getDictionary(locale).admin.paymentStatus;
  return <Badge variant={PAYMENT_STATUS_VARIANTS[status]}>{dict[status]}</Badge>;
}
