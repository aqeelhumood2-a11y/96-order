"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/ui/layout/container";
import { LeafAccent } from "@/ui/layout/leaf-accent";
import { Button } from "@/ui/primitives";
import { cn } from "@/lib/cn";

interface HeroSlide {
  badge: string;
  title: string;
  subtitle: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}

/**
 * Copy is intentionally generic until a CMS module owns this content — see
 * each slide's own doc-comment-worthy intent below. Every link target is a
 * route that genuinely exists and returns real results today (no "Best
 * sellers" slide: that's an admin-only report, not a public listing), so a
 * customer never lands on an empty or missing page from the hero.
 */
const SLIDES: HeroSlide[] = [
  {
    badge: "Coffee & brewing equipment",
    title: "Thoughtfully sourced coffee, brewed right.",
    subtitle: "Browse our current selection of beans and brewing gear. New arrivals and favorites, all in one place.",
    primaryHref: "/products",
    primaryLabel: "Shop all products",
    secondaryHref: "/search",
    secondaryLabel: "Search the catalog",
  },
  {
    badge: "Just landed",
    title: "Fresh arrivals, roasted for now.",
    subtitle: "New beans and gear land regularly — the catalog sorts newest-first, so today's additions are always up top.",
    primaryHref: "/products",
    primaryLabel: "See new arrivals",
    secondaryHref: "/search",
    secondaryLabel: "Search the catalog",
  },
  {
    badge: "Staff picks",
    title: "Our favorites, front and center.",
    subtitle: "A curated shortlist of what we think you'll love — hand-picked, not just best-selling.",
    primaryHref: "/products?featured=true",
    primaryLabel: "Shop featured picks",
    secondaryHref: "/search",
    secondaryLabel: "Search the catalog",
  },
];

const AUTO_ADVANCE_MS = 6000;

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Always advances every AUTO_ADVANCE_MS, full stop — an earlier version
  // paused on hover/focus, which on a touchscreen (no real mouse to ever
  // "leave") can latch into a permanently-paused state after the very first
  // tap anywhere near the hero, which is exactly the bug this was rewritten
  // to fix: the carousel only ever advancing when manually tapped.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
      <LeafAccent corner="top-right" size={480} color="white" />
      <LeafAccent corner="bottom-left" size={360} color="white" />
      <Container className="relative py-20 sm:py-28">
        <div className="grid">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              aria-hidden={index !== activeIndex}
              inert={index !== activeIndex ? true : undefined}
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-start gap-6 transition-opacity duration-500",
                index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
                {slide.badge}
              </span>
              <h1 className="font-display max-w-2xl text-4xl text-balance text-white sm:text-6xl">{slide.title}</h1>
              <p className="max-w-xl text-base text-white/70 sm:text-lg">{slide.subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-white text-brand-900 shadow-lg hover:-translate-y-px hover:bg-white/90 hover:shadow-xl">
                  <Link href={slide.primaryHref}>{slide.primaryLabel}</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/30 text-white hover:border-white/50 hover:bg-white/10">
                  <Link href={slide.secondaryHref}>{slide.secondaryLabel}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex gap-2 sm:mt-20" role="tablist" aria-label="Hero highlights">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show highlight ${index + 1} of ${SLIDES.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
