import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";
import { SearchForm } from "./search-form";
import { MobileNav, type NavLink } from "./mobile-nav";

export interface HeaderProps {
  storeName: string;
  navLinks: NavLink[];
}

/** Presentational only — `ui/` may not depend on `services/` (see `eslint-plugin-boundaries`), so every bit of admin-configured content (store name, nav links) is fetched by the caller (`app/(storefront)/layout.tsx`) and passed in as plain props. */
export function Header({ storeName, navLinks }: HeaderProps) {
  return (
    <header className="border-b border-surface-border bg-background">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" aria-label={storeName} className="flex items-center">
          <Logo color="purple" height={28} priority />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-medium text-brand-800 hover:text-brand-950">
                  {link.label}
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
