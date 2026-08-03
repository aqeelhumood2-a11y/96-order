import { listCustomersQuerySchema, type ParsedListCustomersQuery } from "@/core/customer/schemas";

export function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCustomersSearchParams(raw: Record<string, string | string[] | undefined>): ParsedListCustomersQuery {
  const candidate = { search: firstValue(raw.search), cursor: firstValue(raw.cursor) };
  const result = listCustomersQuerySchema.safeParse(candidate);
  return result.success ? result.data : listCustomersQuerySchema.parse({});
}

export function buildCustomersFilterQueryString(query: ParsedListCustomersQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  return params.toString();
}
