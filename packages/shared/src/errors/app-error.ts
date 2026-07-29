export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

interface AppErrorOptions {
  cause?: unknown;
  details?: Record<string, unknown>;
}

/**
 * Base class for every typed, expected error in the system.
 * `isOperational: true` means the error was anticipated (bad input, missing
 * resource, etc.) and is safe to surface to the client — as opposed to an
 * unexpected bug, which should be logged and masked instead.
 */
export abstract class AppError extends Error {
  abstract readonly code: AppErrorCode;
  abstract readonly httpStatus: number;
  readonly isOperational: boolean = true;
  readonly details?: Record<string, unknown>;

  protected constructor(message: string, options?: AppErrorOptions) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR" as const;
  readonly httpStatus = 400;

  constructor(message = "Invalid input.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
  readonly httpStatus = 404;

  constructor(message = "Resource not found.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED" as const;
  readonly httpStatus = 401;

  constructor(message = "Authentication is required.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN" as const;
  readonly httpStatus = 403;

  constructor(message = "You do not have permission to do this.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export class ConflictError extends AppError {
  readonly code = "CONFLICT" as const;
  readonly httpStatus = 409;

  constructor(message = "This action conflicts with existing state.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export class RateLimitedError extends AppError {
  readonly code = "RATE_LIMITED" as const;
  readonly httpStatus = 429;

  constructor(message = "Too many requests.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export class InternalError extends AppError {
  readonly code = "INTERNAL_ERROR" as const;
  readonly httpStatus = 500;
  override readonly isOperational = false;

  constructor(message = "Something went wrong.", options?: AppErrorOptions) {
    super(message, options);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
