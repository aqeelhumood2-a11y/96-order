import Link from "next/link";
import { Container } from "./container";

const FOOTER_LINKS = [
  { href: "/products", label: "Shop all" },
  { href: "/products?productType=coffee", label: "Coffee" },
  { href: "/products?productType=equipment", label: "Equipment" },
  { href: "/search", label: "Search" },
];

/**
 * CMS-driven footer content (About, Privacy Policy, Terms, etc.) is added
 * once the CMS module exists; these are catalog-discovery links only.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-background">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-800">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-foreground/60">© {new Date().getFullYear()} 96 Order. All rights reserved.</p>
      </Container>
    </footer>
  );
}
