"use client";

import { useEffect } from "react";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives/button";
import { logger } from "@/lib/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("Unhandled route error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-950">
        Something went wrong
      </h1>
      <p className="max-w-sm text-foreground/70">
        We hit an unexpected error. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
}
