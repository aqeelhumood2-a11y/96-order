import Link from "next/link";
import { Container } from "@/ui/layout/container";

export interface DiscoveryLinksProps {
  /** Top-level active categories — same source and shape as the header/footer's category links (see `(storefront)/layout.tsx`), so this section never shows a category the admin didn't actually create. */
  categoryLinks: { href: string; label: string }[];
}

export function DiscoveryLinks({ categoryLinks }: DiscoveryLinksProps) {
  const links = [
    { href: "/products", label: "All products" },
    ...categoryLinks,
    { href: "/products?featured=true", label: "Featured" },
    { href: "/search", label: "Search" },
  ];

  return (
    <section className="border-t border-brand-100 py-12">
      <Container>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/65">Browse</h2>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
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
