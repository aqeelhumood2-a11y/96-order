import Link from "next/link";
import { Container } from "@/ui/layout/container";
import { LeafAccent } from "@/ui/layout/leaf-accent";
import { Button } from "@/ui/primitives";

/**
 * Copy is intentionally generic until a CMS module owns this content. The
 * layout (not the words) is what future CMS-driven content slots into. The
 * brand-900 purple field with two low-opacity leaf accents is the one
 * "hero" moment the tropical-leaf motif is meant for — see `LeafAccent`'s
 * doc comment.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-900">
      <LeafAccent corner="top-right" size={480} color="white" />
      <LeafAccent corner="bottom-left" size={360} color="white" />
      <Container className="relative flex flex-col items-start gap-6 py-16 sm:py-24">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
          Coffee &amp; brewing equipment
        </span>
        <h1 className="font-display max-w-2xl text-4xl text-white sm:text-5xl">Thoughtfully sourced coffee, brewed right.</h1>
        <p className="max-w-xl text-base text-white/70 sm:text-lg">
          Browse our current selection of beans and brewing gear. New arrivals and favorites, all in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white text-brand-900 hover:bg-white/90">
            <Link href="/products">Shop all products</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Link href="/search">Search the catalog</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
