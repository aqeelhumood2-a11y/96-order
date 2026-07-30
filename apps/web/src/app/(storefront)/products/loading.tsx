import { Container } from "@/ui/layout/container";
import { ProductGridSkeleton } from "@/features/storefront/shared/product-grid-skeleton";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="h-8 w-48 animate-pulse rounded bg-brand-100" />
      <div className="mt-6">
        <ProductGridSkeleton />
      </div>
    </Container>
  );
}
