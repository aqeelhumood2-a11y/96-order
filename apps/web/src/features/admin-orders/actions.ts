"use server";

import { revalidatePath } from "next/cache";
import type { Order, OrderStatus } from "@/core/orders/entities";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireSession } from "@/services/auth/session";
import { confirmCashPayment } from "@/services/payments/confirm-cash-payment";
import { confirmOrderPayment } from "@/services/orders/confirm-order-payment";
import { cancelOrder, completeOrder, markOutForDelivery, markPreparing, markReady } from "@/services/orders/order-actions";
import { releaseOrderReservation } from "@/services/orders/release-order-reservation";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

type OrderActionResult = ActionResult<{ status: OrderStatus; version: number }>;

function toOrderActionResult(order: Order): { status: OrderStatus; version: number } {
  return { status: order.status, version: order.version };
}

export async function cancelOrderAction(orderId: string, expectedVersion: number, note?: string): Promise<OrderActionResult> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await cancelOrder(actor, orderId, expectedVersion, note);
    return toOrderActionResult(order);
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

export async function markPreparingAction(orderId: string, expectedVersion: number): Promise<OrderActionResult> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await markPreparing(actor, orderId, expectedVersion);
    return toOrderActionResult(order);
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

export async function markReadyAction(orderId: string, expectedVersion: number): Promise<OrderActionResult> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await markReady(actor, orderId, expectedVersion);
    return toOrderActionResult(order);
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

export async function markOutForDeliveryAction(orderId: string, expectedVersion: number): Promise<OrderActionResult> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await markOutForDelivery(actor, orderId, expectedVersion);
    return toOrderActionResult(order);
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

/** Covers both README's "Mark delivered" and "Complete order" actions — see `services/orders/order-actions.ts#completeOrder`'s doc comment. */
export async function completeOrderAction(orderId: string, expectedVersion: number): Promise<OrderActionResult> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await completeOrder(actor, orderId, expectedVersion);
    return toOrderActionResult(order);
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

export async function confirmCashPaymentAction(orderId: string): Promise<ActionResult<{ paymentStatus: string }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await confirmCashPayment(actor, orderId);
    return { paymentStatus: order.paymentStatus };
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

export async function confirmOrderPaymentAction(orderId: string, expectedVersion: number): Promise<OrderActionResult> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const order = await confirmOrderPayment(actor, { orderId, expectedVersion });
    return toOrderActionResult(order);
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}

export async function releaseOrderReservationAction(orderId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await releaseOrderReservation(actor, orderId);
    return null;
  });
  if (result.ok) revalidateOrderPaths(orderId);
  return result;
}
