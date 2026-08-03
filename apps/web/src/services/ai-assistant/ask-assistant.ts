import { AI_ASSISTANT_MAX_QUESTION_LENGTH, AI_ASSISTANT_RATE_LIMIT } from "@/config/ai-assistant";
import type { Session } from "@/core/auth/entities";
import { RateLimitedError, ValidationError } from "@/core/errors";
import type { AdminAssistantContext } from "@/core/interfaces/ai-assistant-port";
import { bucketOrders, computeCashPaymentsSummary, computeOnlinePaymentsSummary, computeOrdersByStatus } from "@/core/reports/rules";
import { requirePermission } from "@/services/auth/session";
import { logger } from "@/lib/logger";
import { REPORT_SCAN_LIMIT } from "@/services/reports/dependencies";
import { defaultAIAssistantDeps, type AIAssistantDeps } from "./dependencies";

const CONTEXT_WINDOW_DAYS = 30;
const PENDING_CASH_COLLECTION_PREVIEW_LIMIT = 25;

export interface AskAdminAssistantResult {
  answer: string;
  generatedByAI: boolean;
}

async function buildContext(deps: AIAssistantDeps): Promise<AdminAssistantContext> {
  const to = new Date();
  const from = new Date(to.getTime() - CONTEXT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [dashboard, orders, pendingCashPage] = await Promise.all([
    deps.reports.reports.getDashboardCounts(),
    deps.reports.reports.listOrdersForReport(from, to, REPORT_SCAN_LIMIT),
    deps.orders.orders.list({ paymentStatus: "cash_pending", sort: "createdAt", direction: "asc", limit: PENDING_CASH_COLLECTION_PREVIEW_LIMIT }),
  ]);

  return {
    dashboard,
    recentSales: bucketOrders(orders, from, to, "day"),
    ordersByStatus: computeOrdersByStatus(orders),
    cashPayments: computeCashPaymentsSummary(orders),
    onlinePayments: computeOnlinePaymentsSummary(orders),
    pendingCashCollection: pendingCashPage.items.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.fullName,
      fulfillmentMethod: order.fulfillment.method,
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
    })),
  };
}

/**
 * The AI Admin Assistant's one entry point — read-only, permission-gated
 * the same as `/admin/reports` (`reports:view`, since this is effectively
 * a natural-language view over the same aggregate data rather than a new
 * capability), rate-limited per-admin because a real LLM call costs real
 * money per request, and always resilient: if the configured provider
 * (`deps.assistant`) throws, this falls back to `deps.fallbackAssistant`'s
 * deterministic digest rather than surfacing a 500 to the admin. See
 * `core/interfaces/ai-assistant-port.ts` for why the model only ever sees
 * aggregate report data, never raw customer records, and has no tool
 * access to act on anything.
 */
export async function askAdminAssistant(actor: Session, question: string, deps: AIAssistantDeps = defaultAIAssistantDeps): Promise<AskAdminAssistantResult> {
  requirePermission(actor, "reports:view");

  const trimmed = question.trim();
  if (!trimmed) {
    throw new ValidationError("Please enter a question.");
  }
  if (trimmed.length > AI_ASSISTANT_MAX_QUESTION_LENGTH) {
    throw new ValidationError(`Please keep your question under ${AI_ASSISTANT_MAX_QUESTION_LENGTH} characters.`);
  }

  const rateLimitResult = await deps.rateLimiter.consume(`ai-assistant:${actor.uid}`, AI_ASSISTANT_RATE_LIMIT.limit, AI_ASSISTANT_RATE_LIMIT.windowSeconds);
  if (!rateLimitResult.allowed) {
    throw new RateLimitedError("You've asked the assistant too many questions recently. Try again shortly.", {
      details: { retryAfterSeconds: rateLimitResult.retryAfterSeconds },
    });
  }

  const context = await buildContext(deps);

  try {
    const result = await deps.assistant.answer(trimmed, context);
    return { answer: result.text, generatedByAI: result.generatedByAI };
  } catch (error) {
    logger.warn("AI Admin Assistant provider failed, falling back to rules-based digest", {
      actorUid: actor.uid,
      message: error instanceof Error ? error.message : String(error),
    });
    const fallback = await deps.fallbackAssistant.answer(trimmed, context);
    return { answer: fallback.text, generatedByAI: fallback.generatedByAI };
  }
}
