import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";
import { SearchForm } from "./search-form";
import { MobileNav, type NavLink } from "./mobile-nav";

export interface HeaderProps {
  storeName: string;
  navLinks: NavLink[];
}

/**
 * Presentational only — `ui/` may not depend on `services/` (see
 * `eslint-plugin-boundaries`), so every bit of admin-configured content
 * (store name, nav links) is fetched by the caller (`app/(storefront)/layout.tsx`)
 * and passed in as plain props.
 *
 * The brand lockup is the mark (the leaf icon) paired with a live-text
 * logotype in the display serif, not the full illustrated wordmark image —
 * that asset is a nearly-square stacked lockup (see `Logo`'s doc comment)
 * that goes illegible at header height. An icon + serif logotype is both
 * the more legible choice at this size and the more premium one: crisp at
 * any pixel density, no raster upscaling, and the serif-vs-sans contrast
 * against the nav/UI type is the header's one strongest "this is a
 * considered brand, not a template" signal. The illustrated wordmark stays
 * the primary asset everywhere it has room to breathe (footer, print,
 * marketing).
 */
export function Header({ storeName, navLinks }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <Container className="flex h-16 items-center gap-5 sm:h-20 sm:gap-8">
        <Link
          href="/"
          aria-label={storeName}
          className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80 sm:gap-3"
        >
          <Logo variant="mark" color="purple" height={36} priority className="shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">Ninety Six Degrees</span>
            <span className="mt-1 hidden text-[0.65rem] font-semibold tracking-[0.28em] text-secondary-600 sm:block">CAFE</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group relative py-1 text-xs font-semibold tracking-[0.08em] text-brand-800 uppercase transition-colors hover:text-brand-950"
                >
                  {link.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-secondary-600 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SearchForm formId="header-search" className="ml-auto hidden max-w-xs md:flex" />

        <MobileNav links={navLinks} />
      </Container>
    </header>
  );
}
