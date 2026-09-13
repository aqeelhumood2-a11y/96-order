import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface FloatingCartButtonProps {
  itemCount: number;
  locale?: Locale;
}

/**
 * Always-reachable cart entry point — the header nav is limited to
 * Shop/Coffee/Equipment + search with no cart link at all, so without this
 * a shopper who adds something to their cart has no way back to it short of
 * typing /cart directly. `end-6` (a logical property, not `right-6`) is
 * what makes this sit at the trailing edge automatically — bottom-right in
 * English, mirrored to bottom-left in Arabic — without a locale-conditional
 * class.
 */
export function FloatingCartButton({ itemCount, locale = DEFAULT_LOCALE }: FloatingCartButtonProps) {
  const dict = getDictionary(locale).nav;
  const label = itemCount > 0 ? dict.cartWithCount.replace("{count}", String(itemCount)) : dict.cart;

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="fixed bottom-6 end-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-background shadow-lg transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.9-4.706 2.311-7.183.075-.454-.303-.867-.764-.867H5.106M7.5 14.25 5.106 5.272M6 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1 text-xs font-semibold text-background">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
