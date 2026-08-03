import type { AIAssistantPort } from "@/core/interfaces/ai-assistant-port";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";
import { hasAnthropicCredentials } from "@/infrastructure/ai/anthropic-env";
import { AnthropicAssistantProvider } from "@/infrastructure/ai/anthropic-assistant-provider";
import { RuleBasedAssistantProvider } from "@/infrastructure/ai/rule-based-assistant-provider";
import { defaultReportDeps, type ReportDeps } from "@/services/reports/dependencies";
import { defaultOrderTrackingDeps, type OrderTrackingDeps } from "@/services/orders/dependencies";

export interface AIAssistantDeps {
  assistant: AIAssistantPort;
  /** Always available, used as the graceful-degradation fallback when `assistant` (the real provider) errors — see `ask-assistant.ts`. */
  fallbackAssistant: AIAssistantPort;
  reports: ReportDeps;
  orders: OrderTrackingDeps;
  rateLimiter: RateLimiter;
}

/**
 * Same "credential presence selects the real vs. fake implementation"
 * pattern `services/payments/dependencies.ts#defaultPaymentDeps` already
 * establishes for Tap — see `infrastructure/ai/anthropic-env.ts#hasAnthropicCredentials`.
 */
export const defaultAIAssistantDeps: AIAssistantDeps = {
  assistant: hasAnthropicCredentials() ? new AnthropicAssistantProvider() : new RuleBasedAssistantProvider(),
  fallbackAssistant: new RuleBasedAssistantProvider(),
  reports: defaultReportDeps,
  orders: defaultOrderTrackingDeps,
  rateLimiter: new FirestoreRateLimiter(),
};
