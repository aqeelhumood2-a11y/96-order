"use client";

import { useEffect } from "react";
import { Container } from "@/ui/layout/container";
import { ListingError } from "@/features/storefront/shared/listing-error";
import { logger } from "@/lib/logger";

export default function ProductsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("Product listing failed to load", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <Container className="py-8 sm:py-12">
      <ListingError onRetry={reset} />
    </Container>
  );
}
