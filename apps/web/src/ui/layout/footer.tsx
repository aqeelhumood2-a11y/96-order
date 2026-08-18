import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface FooterLinkItem {
  href: string;
  label: string;
}

export interface FooterColumnItem {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterProps {
  footerPages: FooterLinkItem[];
  footerColumns: FooterColumnItem[];
  contactEmail: string;
  contactPhone: string;
  hoursText: string;
  socialLinks: { platform: string; url: string }[];
  paymentLogos: string[];
  freeShippingThresholdText: string;
  copyrightText: string;
  locale?: Locale;
}

/** Presentational only — see `Header`'s doc comment for why. */
export function Footer({
  footerPages,
  footerColumns,
  contactEmail,
  contactPhone,
  hoursText,
  socialLinks,
  paymentLogos,
  freeShippingThresholdText,
  copyrightText,
  locale = DEFAULT_LOCALE,
}: FooterProps) {
  const dict = getDictionary(locale);
  const discoveryLinks: FooterLinkItem[] = [
    { href: "/products", label: dict.footer.shopAll },
    { href: "/products?productType=coffee", label: dict.nav.coffee },
    { href: "/products?productType=equipment", label: dict.nav.equipment },
    { href: "/search", label: dict.nav.search },
  ];

  return (
    <footer className="mt-auto border-t border-surface-border bg-background">
      <Container className="flex flex-col gap-8 py-8">
        <Logo color="purple" height={24} />

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <nav aria-label={dict.footer.shop}>
            <h3 className="text-sm font-semibold text-brand-950">{dict.footer.shop}</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-800">
              {discoveryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {footerPages.length > 0 && (
            <nav aria-label={dict.footer.policies}>
              <h3 className="text-sm font-semibold text-brand-950">{dict.footer.policies}</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-800">
                {footerPages.map((page) => (
                  <li key={page.href}>
                    <Link href={page.href} className="hover:text-brand-950">
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {footerColumns.map((column) => (
            <nav aria-label={column.title} key={column.title}>
              <h3 className="text-sm font-semibold text-brand-950">{column.title}</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-800">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-brand-950">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {(contactEmail || contactPhone || hoursText) && (
            <div>
              <h3 className="text-sm font-semibold text-brand-950">{dict.footer.contact}</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-800">
                {contactEmail && <li>{contactEmail}</li>}
                {contactPhone && <li>{contactPhone}</li>}
                {hoursText && <li className="text-foreground/69">{hoursText}</li>}
              </ul>
            </div>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-4 border-t border-surface-border pt-6 text-sm text-brand-800">
            {socialLinks.map((link) => (
              <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" className="hover:text-brand-950">
                {link.platform}
              </a>
            ))}
          </div>
        )}

        {paymentLogos.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs text-foreground/65">
            {paymentLogos.map((logo) => (
              <span key={logo} className="rounded border border-surface-border px-2 py-1">
                {logo}
              </span>
            ))}
          </div>
        )}

        {freeShippingThresholdText && <p className="text-xs text-foreground/69">{freeShippingThresholdText}</p>}

        <p className="text-sm text-foreground/69">
          © {new Date().getFullYear()} {copyrightText}
        </p>
      </Container>
    </footer>
  );
}
