import "server-only";
import { ANTHROPIC_MODEL } from "@/config/ai-assistant";
import { formatAssistantContext } from "@/core/ai-assistant/format-context";
import type { AdminAssistantContext, AIAssistantAnswer, AIAssistantPort } from "@/core/interfaces/ai-assistant-port";
import { logger } from "@/lib/logger";
import { getAnthropicEnv } from "./anthropic-env";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MAX_OUTPUT_TOKENS = 1024;
const REQUEST_TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT = [
  "You are the AI Admin Assistant inside a coffee/equipment e-commerce admin panel.",
  "Answer the admin's question using ONLY the store data snapshot provided below — never invent numbers.",
  "You have no ability to take any action (no order changes, no refunds, no data edits) — you can only describe and explain the data you were given.",
  "If the question asks for something the snapshot doesn't cover, say so plainly rather than guessing.",
  "Keep answers concise (a few sentences, or a short list) and written for a busy store operator, not a developer.",
].join(" ");

/**
 * Calls Anthropic's Messages API directly over `fetch` (no SDK dependency)
 * whenever `ANTHROPIC_API_KEY` is configured — see
 * `services/ai-assistant/dependencies.ts` for the selection rule against
 * `RuleBasedAssistantProvider`. Strictly read-only and context-bounded: the
 * model is only ever given the aggregate `AdminAssistantContext` snapshot
 * (see that type's doc comment), never raw customer records, and is never
 * granted tool access — this can describe the store's numbers, not act on
 * them.
 *
 * Throws a plain `Error` on any failure (bad response, timeout, network) —
 * `services/ai-assistant/ask-assistant.ts` catches it and falls back to
 * `RuleBasedAssistantProvider`'s digest rather than failing the whole
 * request, so a flaky upstream API never takes down the admin's ability to
 * see their own store data.
 */
export class AnthropicAssistantProvider implements AIAssistantPort {
  async answer(question: string, context: AdminAssistantContext): Promise<AIAssistantAnswer> {
    const { apiKey } = getAnthropicEnv();
    const snapshot = formatAssistantContext(context);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Store data snapshot:\n${snapshot}\n\nAdmin's question: ${question}` }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        logger.error("Anthropic API request failed", { status: response.status, body: body.slice(0, 500) });
        throw new Error(`Anthropic API responded with ${response.status}`);
      }

      const parsed = (await response.json()) as { content?: { type: string; text?: string }[] };
      const text = parsed.content?.find((block) => block.type === "text")?.text?.trim();
      if (!text) {
        throw new Error("Anthropic API returned no text content");
      }

      return { text, generatedByAI: true };
    } catch (error) {
      logger.error("Anthropic API request errored", { message: error instanceof Error ? error.message : String(error) });
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
}
