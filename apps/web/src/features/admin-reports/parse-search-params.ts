import { reportsQuerySchema, type ParsedReportsQuery } from "@/core/reports/schemas";

export function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseReportsSearchParams(raw: Record<string, string | string[] | undefined>): ParsedReportsQuery {
  const candidate = { from: firstValue(raw.from), to: firstValue(raw.to), period: firstValue(raw.period) };
  const result = reportsQuerySchema.safeParse(candidate);
  return result.success ? result.data : reportsQuerySchema.parse({});
}
