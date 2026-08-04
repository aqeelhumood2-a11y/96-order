import Link from "next/link";
import { Container } from "@/ui/layout/container";
import { LeafAccent } from "@/ui/layout/leaf-accent";
import { Button } from "@/ui/primitives";

/**
 * Copy is intentionally generic until a CMS module owns this content. The
 * layout (not the words) is what future CMS-driven content slots into.
 *
 * The layered brand-950→brand-800 field (rather than a flat brand-900
 * fill), the oversized "96°" numeral watermark, and the two low-opacity
 * leaf accents are the one "hero" moment this brand system spends its
 * decorative budget on — see `LeafAccent`'s doc comment. The numeral is
 * plain text, not an image: it's the one detail here that's unique to
 * *this* brand specifically (its actual name), not a generic coffee-shop
 * motif any competitor's template could carry too.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
      <LeafAccent corner="top-right" size={480} color="white" />
      <LeafAccent corner="bottom-left" size={360} color="white" />
      <span
        aria-hidden="true"
        className="font-display pointer-events-none absolute -right-6 -bottom-16 hidden text-[22rem] leading-none font-medium text-white/[0.05] select-none sm:block lg:-right-2 lg:text-[26rem]"
      >
        96°
      </span>

      <Container className="relative flex flex-col items-start gap-7 py-20 sm:py-28 lg:py-32">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary-400" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.28em] text-white/80 uppercase">Specialty coffee &amp; brewing equipment</span>
        </div>

        <h1 className="font-display max-w-2xl text-5xl leading-[1.05] font-semibold text-white sm:text-6xl lg:text-7xl">
          Thoughtfully <em className="text-secondary-300 font-medium italic">sourced</em> coffee,
          <br />
          brewed right.
        </h1>

        <p className="max-w-xl text-base text-white/70 sm:text-lg">
          Explore our current lineup of beans and brewing gear — new arrivals and long-time favorites, all in one place.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="bg-white text-brand-900 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-xl hover:shadow-black/20"
          >
            <Link href="/products">Shop all products</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 text-white transition-all hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10"
          >
            <Link href="/search">Search the catalog</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
