"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogTrigger } from "@/ui/primitives";
import { SearchForm } from "./search-form";

export interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-900 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </DialogTrigger>
      <DialogContent className="top-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-none border-r border-surface-border bg-background p-6 sm:max-w-sm">
        <div className="flex items-center justify-between">
          <DialogTitle className="font-display text-lg font-semibold tracking-tight text-brand-950">Menu</DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/69 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogClose>
        </div>
        <SearchForm formId="mobile-nav-search" className="mt-5" />
        <nav aria-label="Mobile" className="mt-6">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-sm font-semibold tracking-[0.06em] text-brand-900 uppercase transition-colors hover:bg-brand-50 hover:text-brand-950"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
