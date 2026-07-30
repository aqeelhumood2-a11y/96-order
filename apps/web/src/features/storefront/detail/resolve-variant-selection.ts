import type { PublicVariant } from "@/core/storefront/dto";
import { findMatchingVariant, listVariantAttributeNames } from "@/core/storefront/rules";

export interface ResolvedVariantSelection {
  attributeNames: string[];
  selections: Record<string, string>;
  matchedVariant: PublicVariant | null;
}

/**
 * Resolves the effective variant selection for a detail-page render.
 * `rawSelections` comes straight from the URL's query string (untrusted,
 * arbitrary keys/values a shopper can type), so only known attribute names
 * are kept — an unrecognized key is silently dropped rather than trusted.
 * With no selection in the URL at all, the first variant's own combination
 * becomes the default so the page always renders a concrete price/SKU/
 * availability instead of an empty "nothing selected" state.
 */
export function resolveVariantSelection(variants: readonly PublicVariant[], rawSelections: Record<string, string>): ResolvedVariantSelection {
  const attributeNames = listVariantAttributeNames(variants);

  if (attributeNames.length === 0) {
    return { attributeNames, selections: {}, matchedVariant: variants[0] ?? null };
  }

  const sanitized: Record<string, string> = {};
  for (const name of attributeNames) {
    const value = rawSelections[name];
    if (value !== undefined) sanitized[name] = value;
  }

  const selections = Object.keys(sanitized).length > 0 ? sanitized : (variants[0]?.attributeSelections ?? {});

  return { attributeNames, selections, matchedVariant: findMatchingVariant(variants, selections) };
}
