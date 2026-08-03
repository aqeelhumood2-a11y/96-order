import type { CashPaymentsSummary, OnlinePaymentsSummary, OrdersByStatusRow, PendingCashCollectionRow, SalesBucket } from "@/core/reports/entities";
import type { DashboardCounts } from "@/core/interfaces/report-repository";

/**
 * Everything the assistant is allowed to reason about — deliberately only
 * aggregate/report-shaped data the same admin could already see on
 * `/admin` and `/admin/reports` (see `services/ai-assistant/ask-assistant.ts`),
 * never raw customer PII or catalog documents. Keeping the surface this
 * narrow is what makes a provider port safe to hand to a third-party LLM
 * API at all.
 */
export interface AdminAssistantContext {
  dashboard: DashboardCounts;
  recentSales: SalesBucket[];
  ordersByStatus: OrdersByStatusRow[];
  cashPayments: CashPaymentsSummary;
  onlinePayments: OnlinePaymentsSummary;
  pendingCashCollection: PendingCashCollectionRow[];
}

export interface AIAssistantAnswer {
  text: string;
  /** `false` when answered by the deterministic fallback (no AI provider configured) — see `infrastructure/ai/rule-based-assistant-provider.ts`. Surfaced in the admin UI so nobody mistakes a rules-based digest for a real model response. */
  generatedByAI: boolean;
}

/** Port a real LLM-backed provider and a deterministic no-credentials fallback both implement — see `services/ai-assistant/dependencies.ts` for the selection rule. */
export interface AIAssistantPort {
  answer(question: string, context: AdminAssistantContext): Promise<AIAssistantAnswer>;
}
