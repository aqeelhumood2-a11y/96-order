import { AppError, isAppError } from "@96order/shared";

export { AppError, isAppError };
export * from "@96order/shared";

export interface ErrorResponseBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Maps any thrown error to a shape safe to serialize back to the client.
 * Operational `AppError`s expose their real message/details; anything else
 * (a genuine bug) is masked so internals never leak to the response.
 */
export function toErrorResponse(error: unknown): { status: number; body: ErrorResponseBody } {
  if (isAppError(error) && error.isOperational) {
    return {
      status: error.httpStatus,
      body: { code: error.code, message: error.message, details: error.details },
    };
  }

  return {
    status: 500,
    body: { code: "INTERNAL_ERROR", message: "Something went wrong." },
  };
}
