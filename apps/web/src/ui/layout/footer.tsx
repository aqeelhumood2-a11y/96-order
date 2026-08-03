import Link from "next/link";
import { Container } from "./container";

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
}

const DISCOVERY_LINKS: FooterLinkItem[] = [
  { href: "/products", label: "Shop all" },
  { href: "/products?productType=coffee", label: "Coffee" },
  { href: "/products?productType=equipment", label: "Equipment" },
  { href: "/search", label: "Search" },
];

/** Presentational only — see `Header`'s doc comment for why. */
export function Footer({ footerPages, footerColumns, contactEmail, contactPhone, hoursText, socialLinks, paymentLogos, freeShippingThresholdText, copyrightText }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-background">
      <Container className="flex flex-col gap-8 py-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <nav aria-label="Shop">
            <h3 className="text-sm font-semibold text-brand-950">Shop</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-800">
              {DISCOVERY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {footerPages.length > 0 && (
            <nav aria-label="Policies">
              <h3 className="text-sm font-semibold text-brand-950">Policies</h3>
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
              <h3 className="text-sm font-semibold text-brand-950">Contact</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-brand-800">
                {contactEmail && <li>{contactEmail}</li>}
                {contactPhone && <li>{contactPhone}</li>}
                {hoursText && <li className="text-foreground/60">{hoursText}</li>}
              </ul>
            </div>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-4 border-t border-brand-100 pt-6 text-sm text-brand-800">
            {socialLinks.map((link) => (
              <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" className="hover:text-brand-950">
                {link.platform}
              </a>
            ))}
          </div>
        )}

        {paymentLogos.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs text-foreground/50">
            {paymentLogos.map((logo) => (
              <span key={logo} className="rounded border border-brand-100 px-2 py-1">
                {logo}
              </span>
            ))}
          </div>
        )}

        {freeShippingThresholdText && <p className="text-xs text-foreground/60">{freeShippingThresholdText}</p>}

        <p className="text-sm text-foreground/60">
          © {new Date().getFullYear()} {copyrightText}
        </p>
      </Container>
    </footer>
  );
}
