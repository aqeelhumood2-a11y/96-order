import Link from "next/link";
import type { PublicProductSummary } from "@/core/storefront/dto";
import { Container } from "@/ui/layout/container";
import { ProductCard } from "@/features/storefront/shared/product-card";

export interface ProductSectionProps {
  title: string;
  description?: string;
  viewAllHref: string;
  products: PublicProductSummary[];
}

/** Renders nothing when there's no data — an empty catalog section shouldn't show an empty shelf. */
export function ProductSection({ title, description, viewAllHref, products }: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-brand-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-foreground/60">{description}</p>}
          </div>
          <Link href={viewAllHref} className="whitespace-nowrap text-sm font-medium text-brand-700 hover:text-brand-900 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
