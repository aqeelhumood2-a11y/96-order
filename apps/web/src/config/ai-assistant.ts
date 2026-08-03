/** AI Admin Assistant configuration. Values, not secrets — the actual credential lives in `ANTHROPIC_API_KEY`, read only by `infrastructure/ai/anthropic-env.ts`. */

/** Per-admin throttle on `askAdminAssistant` — a real LLM call costs real money per request, unlike everything else this app rate-limits (which only guards against brute force). */
export const AI_ASSISTANT_RATE_LIMIT = { limit: 20, windowSeconds: 15 * 60 };

export const AI_ASSISTANT_MAX_QUESTION_LENGTH = 500;

export const ANTHROPIC_MODEL = "claude-sonnet-5" as const;
