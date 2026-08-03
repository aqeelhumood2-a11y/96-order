"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/core/orders/entities";
import { allowedNextStatuses } from "@/core/orders/rules";
import { Button } from "@/ui/primitives/button";
import {
  cancelOrderAction,
  completeOrderAction,
  confirmCashPaymentAction,
  confirmOrderPaymentAction,
  markOutForDeliveryAction,
  markPreparingAction,
  markReadyAction,
  releaseOrderReservationAction,
} from "../actions";

const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Move to pending payment",
  confirmed: "Confirm order",
  preparing: "Mark preparing",
  ready: "Mark ready",
  out_for_delivery: "Mark out for delivery",
  completed: "Complete order",
  cancelled: "Cancel order",
};

export interface OrderActionsPanelProps {
  order: Pick<Order, "id" | "version" | "status" | "fulfillment" | "paymentMethod" | "paymentStatus">;
  canManageOrders: boolean;
  canManagePayments: boolean;
}

export function OrderActionsPanel({ order, canManageOrders, canManagePayments }: OrderActionsPanelProps) {
  const router = useRouter();
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
          const note = window.prompt("Reason for cancelling this order (optional):") ?? undefined;
          return cancelOrderAction(order.id, order.version, note || undefined);
        });
    }
    if (toStatus === "preparing") return () => run(toStatus, () => markPreparingAction(order.id, order.version));
    if (toStatus === "ready") return () => run(toStatus, () => markReadyAction(order.id, order.version));
    if (toStatus === "out_for_delivery") return () => run(toStatus, () => markOutForDeliveryAction(order.id, order.version));
    if (toStatus === "completed") return () => run(toStatus, () => completeOrderAction(order.id, order.version));
    return undefined;
  }

  const completedLabel = order.fulfillment.method === "delivery" ? "Mark delivered" : "Complete order";

  return (
    <div className="flex flex-col gap-3 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">Actions</h2>

      <div className="flex flex-wrap gap-2">
        {canManagePayments && order.paymentMethod === "cash" && order.paymentStatus === "cash_pending" && (
          <Button size="sm" disabled={isSubmitting} onClick={() => run("confirm-cash", () => confirmCashPaymentAction(order.id))}>
            {pendingAction === "confirm-cash" ? "Confirming…" : "Confirm cash payment"}
          </Button>
        )}

        {canManagePayments && order.paymentMethod === "tap" && (order.paymentStatus === "pending" || order.paymentStatus === "authorized") && (
          <Button size="sm" disabled={isSubmitting} onClick={() => run("confirm-payment", () => confirmOrderPaymentAction(order.id, order.version))}>
            {pendingAction === "confirm-payment" ? "Confirming…" : "Confirm payment"}
          </Button>
        )}

        {nextStatuses
          .filter((status) => status !== "cancelled")
          .map((status) => {
            const handler = actionForStatus(status);
            if (!handler) return null;
            const label = status === "completed" ? completedLabel : STATUS_ACTION_LABEL[status];
            return (
              <Button key={status} size="sm" variant="outline" disabled={isSubmitting} onClick={handler}>
                {pendingAction === status ? "Working…" : label}
              </Button>
            );
          })}

        {canManageOrders && (
          <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => run("release", () => releaseOrderReservationAction(order.id))}>
            {pendingAction === "release" ? "Releasing…" : "Release reservation"}
          </Button>
        )}

        {canManageOrders && nextStatuses.includes("cancelled") && (
          <Button size="sm" variant="destructive" disabled={isSubmitting} onClick={actionForStatus("cancelled")}>
            {pendingAction === "cancelled" ? "Cancelling…" : "Cancel order"}
          </Button>
        )}
      </div>

      {!canManageOrders && !canManagePayments && <p className="text-xs text-foreground/50">You don&apos;t have permission to act on this order.</p>}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
