import Link from "next/link";
import type { PublicCategory } from "@/core/storefront/dto";
import { Container } from "@/ui/layout/container";

export function FeaturedCategories({ categories }: { categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-brand-50/40 py-12 sm:py-16">
      <Container>
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex aspect-[3/2] flex-col justify-end rounded-lg border border-brand-100 bg-background p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="font-medium text-brand-950">{category.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
