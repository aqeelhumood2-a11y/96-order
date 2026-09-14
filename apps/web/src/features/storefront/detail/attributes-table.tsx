import type { CoffeeAttributes, Dimensions, EquipmentAttributes } from "@/core/catalog/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface AttributesTableProps {
  coffee?: CoffeeAttributes;
  equipment?: EquipmentAttributes;
  weightGrams?: number;
  dimensions?: Dimensions;
  locale?: Locale;
}

function humanizeLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toLocaleDateString();
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : null;
  return String(value);
}

/** Same field names the admin product form edits — reuses its translated labels instead of a second copy of "bean type", "roast level", etc. */
function labelFor(key: string, productForm: ReturnType<typeof getDictionary>["admin"]["productForm"]): string {
  const known: Record<string, string | undefined> = {
    beanType: productForm.beanType,
    roastLevel: productForm.roastLevel,
    originCountry: productForm.originCountry,
    region: productForm.region,
    farmOrProducer: productForm.farmOrProducer,
    processingMethod: productForm.processingMethod,
    variety: productForm.variety,
    grindType: productForm.grindType,
    tastingNotes: productForm.tastingNotes,
    manufacturer: productForm.manufacturer,
    model: productForm.model,
    material: productForm.material,
    color: productForm.color,
    capacity: productForm.capacity,
    voltage: productForm.voltage,
    warrantyPeriod: productForm.warrantyPeriod,
  };
  return known[key] ?? humanizeLabel(key);
}

function entriesOf(record: Record<string, unknown> | undefined, productForm: ReturnType<typeof getDictionary>["admin"]["productForm"]): [string, string][] {
  if (!record) return [];
  const rows: [string, string][] = [];
  for (const [key, value] of Object.entries(record)) {
    const formatted = formatValue(value);
    if (formatted !== null) rows.push([labelFor(key, productForm), formatted]);
  }
  return rows;
}

export function AttributesTable({ coffee, equipment, weightGrams, dimensions, locale = DEFAULT_LOCALE }: AttributesTableProps) {
  const dict = getDictionary(locale);
  const rows: [string, string][] = [
    ...entriesOf(coffee as Record<string, unknown> | undefined, dict.admin.productForm),
    ...entriesOf(equipment as Record<string, unknown> | undefined, dict.admin.productForm),
  ];

  if (weightGrams !== undefined) rows.push([dict.storefront.detail.weightLabel, `${weightGrams} g`]);
  if (dimensions) rows.push([dict.storefront.detail.dimensionsLabel, `${dimensions.lengthCm} × ${dimensions.widthCm} × ${dimensions.heightCm} cm`]);

  if (rows.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-brand-100 pb-2 text-sm sm:justify-start">
          <dt className="text-foreground/69">{label}</dt>
          <dd className="font-medium text-brand-950 sm:ml-auto">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
