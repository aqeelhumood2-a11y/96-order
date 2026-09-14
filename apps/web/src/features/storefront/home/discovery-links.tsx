import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Container } from "@/ui/layout/container";

export interface DiscoveryLinksProps {
  /** Top-level active categories — same source and shape as the header/footer's category links (see `(storefront)/layout.tsx`), so this section never shows a category the admin didn't actually create. */
  categoryLinks: { href: string; label: string }[];
  locale?: Locale;
}

export function DiscoveryLinks({ categoryLinks, locale = DEFAULT_LOCALE }: DiscoveryLinksProps) {
  const dict = getDictionary(locale);
  const links = [
    { href: "/products", label: dict.storefront.home.allProducts },
    ...categoryLinks,
    { href: "/products?featured=true", label: dict.storefront.home.featured },
    { href: "/search", label: dict.nav.search },
  ];

  return (
    <section className="border-t border-brand-100 py-12">
      <Container>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/65">{dict.storefront.home.browse}</h2>
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
