import Link from "next/link";
import { Container } from "@/ui/layout/container";

const LINKS = [
  { href: "/products", label: "All products" },
  { href: "/products?productType=coffee", label: "Coffee" },
  { href: "/products?productType=equipment", label: "Equipment" },
  { href: "/products?featured=true", label: "Featured" },
  { href: "/search", label: "Search" },
];

export function DiscoveryLinks() {
  return (
    <section className="border-t border-brand-100 py-12">
      <Container>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/65">Browse</h2>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-base font-medium text-brand-800 hover:text-brand-950 hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
