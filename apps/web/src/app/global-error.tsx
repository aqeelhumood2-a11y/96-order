"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { Logo } from "@/ui/layout/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled root error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center font-sans">
        <Logo variant="mark" color="purple" height={40} className="mb-2" />
        <h1 className="text-3xl font-semibold tracking-tight text-brand-950">Something went wrong</h1>
        <p className="max-w-sm text-foreground/69">
          The application hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
