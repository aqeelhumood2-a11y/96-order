"use client";

import { useState, type ReactNode } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogTrigger, Button } from "@/ui/primitives";

export function MobileFilterDrawer({ children, locale = DEFAULT_LOCALE }: { children: ReactNode; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.listing;
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="md:hidden">
          {dict.filters}
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 max-h-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none p-6 sm:max-w-sm">
        <div className="flex items-center justify-between">
          <DialogTitle>{dict.filters}</DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label={dict.closeFilters}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/69 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogClose>
        </div>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
