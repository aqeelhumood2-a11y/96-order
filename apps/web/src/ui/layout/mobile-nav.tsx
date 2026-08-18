"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogTrigger } from "@/ui/primitives";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { SearchForm } from "./search-form";

export interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links, locale = DEFAULT_LOCALE }: { links: NavLink[]; locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const dict = getDictionary(locale);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={dict.nav.openMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 max-w-none translate-x-0 translate-y-0 rounded-none p-6 sm:max-w-sm">
        <div className="flex items-center justify-between">
          <DialogTitle>{dict.nav.menu}</DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label={dict.nav.closeMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/69 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogClose>
        </div>
        <SearchForm formId="mobile-nav-search" locale={locale} className="mt-4" />
        <nav aria-label={dict.nav.mobile} className="mt-6">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-base font-medium text-brand-900 hover:bg-brand-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 border-t border-surface-border pt-4 text-sm">
          <LanguageSwitcher locale={locale} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
