import { toErrorResponse } from "@/core/errors";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

/** Wraps a Server Action body so thrown `AppError`s become a typed result instead of an opaque server-error digest on the client. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    const { body } = toErrorResponse(error);
    return { ok: false, code: body.code, message: body.message };
  }
}
