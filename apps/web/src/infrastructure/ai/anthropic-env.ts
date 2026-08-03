import "server-only";
import { z } from "zod";

const anthropicEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
});

export interface AnthropicEnv {
  apiKey: string;
}

let cached: AnthropicEnv | undefined;

/**
 * Same "throw only when actually used, never at import time" shape as
 * `infrastructure/payments/tap/env.ts#getTapEnv` — see that file's doc
 * comment. `hasAnthropicCredentials()` is what
 * `services/ai-assistant/dependencies.ts` uses to pick between the real
 * provider and the deterministic fallback.
 */
export function getAnthropicEnv(): AnthropicEnv {
  if (cached) return cached;

  const parsed = anthropicEnvSchema.safeParse({ ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY });
  if (!parsed.success) {
    throw new Error("ANTHROPIC_API_KEY is not set — the AI Admin Assistant falls back to a rules-based digest instead.");
  }

  cached = { apiKey: parsed.data.ANTHROPIC_API_KEY };
  return cached;
}

export function hasAnthropicCredentials(): boolean {
  return anthropicEnvSchema.safeParse({ ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }).success;
}
