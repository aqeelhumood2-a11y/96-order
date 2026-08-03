import type { CoffeeAttributes, Dimensions, EquipmentAttributes } from "@/core/catalog/entities";

export interface AttributesTableProps {
  coffee?: CoffeeAttributes;
  equipment?: EquipmentAttributes;
  weightGrams?: number;
  dimensions?: Dimensions;
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

function entriesOf(record: Record<string, unknown> | undefined): [string, string][] {
  if (!record) return [];
  const rows: [string, string][] = [];
  for (const [key, value] of Object.entries(record)) {
    const formatted = formatValue(value);
    if (formatted !== null) rows.push([humanizeLabel(key), formatted]);
  }
  return rows;
}

export function AttributesTable({ coffee, equipment, weightGrams, dimensions }: AttributesTableProps) {
  const rows: [string, string][] = [
    ...entriesOf(coffee as Record<string, unknown> | undefined),
    ...entriesOf(equipment as Record<string, unknown> | undefined),
  ];

  if (weightGrams !== undefined) rows.push(["Weight", `${weightGrams} g`]);
  if (dimensions) rows.push(["Dimensions", `${dimensions.lengthCm} × ${dimensions.widthCm} × ${dimensions.heightCm} cm`]);

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
