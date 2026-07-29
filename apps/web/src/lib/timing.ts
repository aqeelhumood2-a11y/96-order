/**
 * Delays until `minMs` has elapsed since `startedAt`, or resolves
 * immediately if that time has already passed. Used to normalize response
 * time across branches that otherwise do measurably different amounts of
 * work (see config/auth.ts's MINIMUM_LOGIN_RESPONSE_MS for why).
 */
export async function padToMinimumDuration(startedAt: number, minMs: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = minMs - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
