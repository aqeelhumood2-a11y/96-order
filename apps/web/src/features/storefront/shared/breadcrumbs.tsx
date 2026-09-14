import Link from "next/link";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  locale?: Locale;
}

export function Breadcrumbs({ items, className, locale = DEFAULT_LOCALE }: BreadcrumbsProps) {
  const dict = getDictionary(locale).storefront.listing;

  return (
    <nav aria-label={dict.breadcrumb} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-foreground/69">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-foreground/30">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-brand-900 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-brand-950")}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
