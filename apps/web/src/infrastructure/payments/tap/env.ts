import "server-only";
import { z } from "zod";

const tapEnvSchema = z.object({
  TAP_SECRET_KEY: z.string().min(1),
});

export interface TapEnv {
  secretKey: string;
}

let cached: TapEnv | undefined;

/**
 * Throws a readable error the first time Tap is actually used without a
 * configured secret key — not at module load, so importing this file (or
 * anything that transitively does) never fails a build/test run that
 * doesn't need real Tap access. See `services/payments/dependencies.ts`
 * for how the absence of this key is what selects `FakeTapProvider`
 * instead of `TapPaymentProvider` in the first place.
 */
export function getTapEnv(): TapEnv {
  if (cached) return cached;

  const parsed = tapEnvSchema.safeParse({ TAP_SECRET_KEY: process.env.TAP_SECRET_KEY });
  if (!parsed.success) {
    throw new Error(
      "TAP_SECRET_KEY is not set. Copy .env.example and fill in your Tap Payments secret key (test or live) — see README's Tap configuration section.",
    );
  }

  cached = { secretKey: parsed.data.TAP_SECRET_KEY };
  return cached;
}

export function hasTapCredentials(): boolean {
  return tapEnvSchema.safeParse({ TAP_SECRET_KEY: process.env.TAP_SECRET_KEY }).success;
}
