import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";
import { SearchForm } from "./search-form";
import { MobileNav, type NavLink } from "./mobile-nav";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface HeaderProps {
  storeName: string;
  navLinks: NavLink[];
  locale?: Locale;
}

/**
 * Presentational only — `ui/` may not depend on `services/` (see
 * `eslint-plugin-boundaries`), so every bit of admin-configured content
 * (store name, nav links) is fetched by the caller (`app/(storefront)/layout.tsx`)
 * and passed in as plain props.
 *
 * The logo renders larger than before (40px vs. the original 28px) with a
 * bit more breathing room around it — it's the one element this header is
 * built to draw the eye to; everything else (nav, search) stays exactly as
 * it was.
 */
export function Header({ storeName, navLinks, locale = DEFAULT_LOCALE }: HeaderProps) {
  return (
    <header className="border-b border-surface-border bg-background">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" aria-label={storeName} className="flex items-center py-2 transition-opacity hover:opacity-80">
          <Logo color="purple" height={40} priority />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-medium text-brand-800 transition-colors hover:text-brand-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SearchForm formId="header-search" locale={locale} className="ml-auto hidden max-w-xs md:flex" />

        <LanguageSwitcher locale={locale} className="hidden text-sm md:block" />

        <MobileNav links={navLinks} locale={locale} />
      </Container>
    </header>
  );
}
