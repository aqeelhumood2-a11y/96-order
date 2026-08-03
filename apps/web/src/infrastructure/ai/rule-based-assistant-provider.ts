import "server-only";
import { formatAssistantContext } from "@/core/ai-assistant/format-context";
import type { AdminAssistantContext, AIAssistantAnswer, AIAssistantPort } from "@/core/interfaces/ai-assistant-port";

/**
 * The always-available fallback when `ANTHROPIC_API_KEY` isn't configured
 * (the default in this repository's CI/emulator/local-dev runs — mirrors
 * `infrastructure/payments/tap/fake-tap-provider.ts`'s "always works, never
 * needs credentials" role, except a real LLM's free-form reasoning can't be
 * faithfully faked, so instead of guessing at an answer this returns the
 * same structured data snapshot `AnthropicAssistantProvider` would have
 * reasoned over — genuinely useful, never a fabricated response, and
 * `generatedByAI: false` so the admin UI is honest about which one ran.
 */
export class RuleBasedAssistantProvider implements AIAssistantPort {
  async answer(_question: string, context: AdminAssistantContext): Promise<AIAssistantAnswer> {
    const snapshot = formatAssistantContext(context);
    return {
      text: `The AI Admin Assistant isn't fully configured (no ANTHROPIC_API_KEY), so here's your current store snapshot instead of a conversational answer:\n\n${snapshot}`,
      generatedByAI: false,
    };
  }
}
