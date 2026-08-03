import { formatMoney } from "@/core/money/money";
import type { AdminAssistantContext } from "@/core/interfaces/ai-assistant-port";

/**
 * Renders `AdminAssistantContext` as plain text — shared by both
 * `infrastructure/ai/anthropic-assistant-provider.ts` (as the prompt's
 * data section) and `infrastructure/ai/rule-based-assistant-provider.ts`
 * (as its entire answer), so the two providers can never disagree about
 * what a given snapshot of store data actually says.
 */
export function formatAssistantContext(context: AdminAssistantContext): string {
  const lines: string[] = [];

  lines.push(`Total orders: ${context.dashboard.totalOrders}`);
  lines.push(`Total revenue: ${formatMoney(context.dashboard.totalRevenue)}`);
  lines.push("Orders by status:");
  for (const row of context.ordersByStatus) {
    lines.push(`  - ${row.status}: ${row.count}`);
  }

  if (context.recentSales.length > 0) {
    lines.push("Recent sales (most recent last):");
    for (const bucket of context.recentSales) {
      lines.push(`  - ${bucket.periodLabel}: ${bucket.orderCount} orders, ${formatMoney(bucket.revenue)}`);
    }
  }

  lines.push(
    `Cash payments: ${context.cashPayments.pendingCount} pending (${formatMoney(context.cashPayments.pendingTotal)}), ${context.cashPayments.confirmedCount} confirmed (${formatMoney(context.cashPayments.confirmedTotal)}); ${context.cashPayments.deliveryCount} delivery, ${context.cashPayments.pickupCount} pickup.`,
  );
  lines.push(
    `Online (Tap) payments: ${context.onlinePayments.paidCount} paid (${formatMoney(context.onlinePayments.paidTotal)}), ${context.onlinePayments.failedCount} failed, ${context.onlinePayments.refundedCount} refunded (${formatMoney(context.onlinePayments.refundedTotal)}).`,
  );

  if (context.pendingCashCollection.length > 0) {
    lines.push(`Orders awaiting cash collection (oldest first, ${context.pendingCashCollection.length} total):`);
    for (const row of context.pendingCashCollection.slice(0, 10)) {
      lines.push(`  - ${row.orderNumber} (${row.customerName}, ${row.fulfillmentMethod}): ${formatMoney(row.grandTotal)}`);
    }
    if (context.pendingCashCollection.length > 10) {
      lines.push(`  - …and ${context.pendingCashCollection.length - 10} more.`);
    }
  } else {
    lines.push("No orders are currently awaiting cash collection.");
  }

  return lines.join("\n");
}
