import Link from "next/link";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives";

/**
 * Placeholder hero — copy and imagery are intentionally generic until a
 * CMS module owns this content. The layout (not the words) is what future
 * CMS-driven content slots into.
 */
export function Hero() {
  return (
    <section className="border-b border-brand-100 bg-brand-50/60">
      <Container className="flex flex-col items-start gap-6 py-16 sm:py-24">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-700">
          Coffee &amp; brewing equipment
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
          Thoughtfully sourced coffee, brewed right.
        </h1>
        <p className="max-w-xl text-base text-foreground/70 sm:text-lg">
          Browse our current selection of beans and brewing gear. New arrivals and favorites, all in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/products">Shop all products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Search the catalog</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
