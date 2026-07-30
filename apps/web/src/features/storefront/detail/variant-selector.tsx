import Link from "next/link";
import type { PublicVariant } from "@/core/storefront/dto";
import { getAvailableAttributeValues } from "@/core/storefront/rules";
import { cn } from "@/lib/cn";

export interface VariantSelectorProps {
  basePath: string;
  variants: PublicVariant[];
  attributeNames: string[];
  selections: Record<string, string>;
}

function buildSelectionHref(basePath: string, selections: Record<string, string>, attributeName: string, value: string): string {
  const params = new URLSearchParams();
  for (const [name, existingValue] of Object.entries(selections)) {
    params.set(name, name === attributeName ? value : existingValue);
  }
  if (!(attributeName in selections)) params.set(attributeName, value);
  return `${basePath}?${params.toString()}`;
}

/**
 * Every option renders as a plain link (no JavaScript required) to a URL
 * that already encodes the resulting selection — this is what makes a
 * variant combination shareable and bookmarkable. Options that don't form
 * a real variant combination with whatever else is currently selected
 * render as inert, struck-through text rather than a link, so a shopper
 * can never navigate to an invalid combination in the first place.
 */
export function VariantSelector({ basePath, variants, attributeNames, selections }: VariantSelectorProps) {
  if (attributeNames.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {attributeNames.map((attributeName) => {
        const allValues = Array.from(
          new Set(variants.map((variant) => variant.attributeSelections[attributeName]).filter((value): value is string => value !== undefined)),
        );
        const availableValues = getAvailableAttributeValues(variants, selections, attributeName);
        const selectedValue = selections[attributeName];

        return (
          <fieldset key={attributeName}>
            <legend className="mb-2 text-sm font-medium text-foreground">{attributeName}</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label={attributeName}>
              {allValues.map((value) => {
                const isSelected = value === selectedValue;
                const isAvailable = availableValues.has(value);

                if (!isAvailable) {
                  return (
                    <span
                      key={value}
                      aria-disabled="true"
                      className="cursor-not-allowed rounded-md border border-brand-100 px-3 py-1.5 text-sm text-foreground/30 line-through"
                    >
                      {value}
                    </span>
                  );
                }

                return (
                  <Link
                    key={value}
                    href={buildSelectionHref(basePath, selections, attributeName, value)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-brand-300 text-brand-900 hover:bg-brand-50",
                    )}
                  >
                    {value}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
