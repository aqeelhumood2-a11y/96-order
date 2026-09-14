"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/core/orders/entities";
import { allowedNextStatuses } from "@/core/orders/rules";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";
import {
  acceptOrderAction,
  cancelOrderAction,
  completeOrderAction,
  confirmCashPaymentAction,
  confirmOrderPaymentAction,
  markOutForDeliveryAction,
  markPreparingAction,
  markReadyAction,
  releaseOrderReservationAction,
} from "../actions";

export interface OrderActionsPanelProps {
  order: Pick<Order, "id" | "version" | "status" | "fulfillment" | "paymentMethod" | "paymentStatus">;
  canManageOrders: boolean;
  canManagePayments: boolean;
  locale?: Locale;
}

export function OrderActionsPanel({ order, canManageOrders, canManagePayments, locale = DEFAULT_LOCALE }: OrderActionsPanelProps) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.orderDetail.actions;
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isSubmitting = pendingAction !== null;

  async function run(actionName: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    setPendingAction(actionName);
    try {
      const result = await fn();
      if (!result.ok) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  const nextStatuses = canManageOrders ? allowedNextStatuses(order.status, order.fulfillment.method) : [];

  function actionForStatus(toStatus: OrderStatus) {
    if (toStatus === "cancelled") {
      return () =>
        run("cancelled", () => {
          const note = window.prompt(dict.cancelReasonPrompt) ?? undefined;
          return cancelOrderAction(order.id, order.version, note || undefined);
        });
    }
    if (toStatus === "accepted") return () => run(toStatus, () => acceptOrderAction(order.id, order.version));
    if (toStatus === "preparing") return () => run(toStatus, () => markPreparingAction(order.id, order.version));
    if (toStatus === "ready") return () => run(toStatus, () => markReadyAction(order.id, order.version));
    if (toStatus === "out_for_delivery") return () => run(toStatus, () => markOutForDeliveryAction(order.id, order.version));
    if (toStatus === "completed") return () => run(toStatus, () => completeOrderAction(order.id, order.version));
    return undefined;
  }

  const completedLabel = order.fulfillment.method === "delivery" ? dict.markDelivered : dict.statusAction.completed;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">{dict.heading}</h2>

      <div className="flex flex-wrap gap-2">
        {canManagePayments && order.paymentMethod === "cash" && order.paymentStatus === "cash_pending" && (
          <Button size="sm" disabled={isSubmitting} onClick={() => run("confirm-cash", () => confirmCashPaymentAction(order.id))}>
            {pendingAction === "confirm-cash" ? dict.confirming : dict.confirmCashPayment}
          </Button>
        )}

        {canManagePayments && order.paymentMethod === "tap" && (order.paymentStatus === "pending" || order.paymentStatus === "authorized") && (
          <Button size="sm" disabled={isSubmitting} onClick={() => run("confirm-payment", () => confirmOrderPaymentAction(order.id, order.version))}>
            {pendingAction === "confirm-payment" ? dict.confirming : dict.confirmPayment}
          </Button>
        )}

        {nextStatuses
          .filter((status) => status !== "cancelled")
          .map((status) => {
            const handler = actionForStatus(status);
            if (!handler) return null;
            const label = status === "completed" ? completedLabel : dict.statusAction[status];
            return (
              <Button key={status} size="sm" variant="outline" disabled={isSubmitting} onClick={handler}>
                {pendingAction === status ? dict.working : label}
              </Button>
            );
          })}

        {canManageOrders && (
          <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => run("release", () => releaseOrderReservationAction(order.id))}>
            {pendingAction === "release" ? dict.releasing : dict.releaseReservation}
          </Button>
        )}

        {canManageOrders && nextStatuses.includes("cancelled") && (
          <Button size="sm" variant="destructive" disabled={isSubmitting} onClick={actionForStatus("cancelled")}>
            {pendingAction === "cancelled" ? dict.cancelling : dict.cancelOrder}
          </Button>
        )}
      </div>

      {!canManageOrders && !canManagePayments && <p className="text-xs text-foreground/65">{dict.noPermission}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
