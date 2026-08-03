import { z } from "zod";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 30;

export const REPORT_PERIODS = ["day", "week", "month"] as const;

/** Query-param validation for `/admin/reports` — see `core/orders/schemas.ts#listOrdersQuerySchema`'s doc comment for why this is parsed with Zod rather than passed through raw. */
export const reportsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    period: z.enum(REPORT_PERIODS).default("day"),
  })
  .transform((value) => {
    const to = value.to ?? new Date();
    const from = value.from ?? new Date(to.getTime() - DEFAULT_WINDOW_DAYS * MS_PER_DAY);
    return { from, to, period: value.period };
  });
export type ParsedReportsQuery = z.infer<typeof reportsQuerySchema>;
