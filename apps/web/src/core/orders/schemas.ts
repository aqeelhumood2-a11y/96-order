import { z } from "zod";
import { FULFILLMENT_METHODS } from "@/core/delivery/entities";
import { PAYMENT_STATUSES } from "@/core/payments/entities";
import { ORDER_STATUSES } from "./entities";

export const ORDER_SORT_FIELDS = ["createdAt", "grandTotal", "orderNumber"] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

/**
 * Query-param validation for `/admin/orders` — untrusted input (a URL any
 * signed-in staff member can type or bookmark), parsed with Zod before it
 * ever reaches `OrderRepository.list()`, the same discipline
 * `core/storefront/schemas.ts#listProductsQuerySchema` applies to the
 * public storefront's own filter URLs. `dateFrom`/`dateTo` are combined
 * with a range filter on `createdAt` in the Firestore query, which is why
 * `sort` is forced back to `createdAt` when either is set — see
 * `services/orders/list-orders.ts`'s doc comment for the Firestore
 * single-range-field constraint this works around.
 */
export const listOrdersQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  fulfillmentMethod: z.enum(FULFILLMENT_METHODS).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(ORDER_SORT_FIELDS).default("createdAt"),
  direction: z.enum(SORT_DIRECTIONS).default("desc"),
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().positive().max(100).default(25),
});
export type ListOrdersQuery = z.input<typeof listOrdersQuerySchema>;
export type ParsedListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const changeOrderStatusSchema = z.object({
  orderId: z.string().trim().min(1),
  toStatus: z.enum(ORDER_STATUSES),
  expectedVersion: z.number().int().positive(),
  note: z.string().trim().max(1000).optional(),
});
export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;

export const confirmOrderPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
  expectedVersion: z.number().int().positive(),
});
export type ConfirmOrderPaymentInput = z.infer<typeof confirmOrderPaymentSchema>;
