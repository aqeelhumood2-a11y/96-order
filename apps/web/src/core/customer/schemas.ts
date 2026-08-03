import { z } from "zod";

/** Query-param validation for `/admin/customers` — see `core/orders/schemas.ts#listOrdersQuerySchema`'s doc comment for why this is parsed with Zod at the route boundary rather than passed through raw. */
export const listCustomersQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().positive().max(100).default(25),
});
export type ListCustomersQuery = z.input<typeof listCustomersQuerySchema>;
export type ParsedListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
