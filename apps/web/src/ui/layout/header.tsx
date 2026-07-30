import Link from "next/link";
import { Container } from "./container";
import { SearchForm } from "./search-form";
import { MobileNav, type NavLink } from "./mobile-nav";

const NAV_LINKS: NavLink[] = [
  { href: "/products", label: "Shop" },
  { href: "/products?productType=coffee", label: "Coffee" },
  { href: "/products?productType=equipment", label: "Equipment" },
];

export function Header() {
  return (
    <header className="border-b border-brand-100 bg-background">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand-900">
          96 Order
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-medium text-brand-800 hover:text-brand-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SearchForm formId="header-search" className="ml-auto hidden max-w-xs md:flex" />

        <MobileNav links={NAV_LINKS} />
      </Container>
    </header>
  );
}
