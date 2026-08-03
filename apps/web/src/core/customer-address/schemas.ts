import { z } from "zod";
import { ADDRESS_LABELS } from "./entities";

const deliveryAddressSchema = z.object({
  country: z.string().trim().min(1).max(2).default("BH"),
  area: z.string().trim().min(1, "Area is required."),
  block: z.string().trim().min(1, "Block is required."),
  road: z.string().trim().min(1, "Road is required."),
  building: z.string().trim().min(1, "Building is required."),
  flat: z.string().trim().max(50).optional(),
  landmark: z.string().trim().max(200).optional(),
  instructions: z.string().trim().max(500).optional(),
});

export const customerAddressInputSchema = z.object({
  label: z.enum(ADDRESS_LABELS),
  customLabel: z.string().trim().max(50).optional(),
  recipientName: z.string().trim().min(2, "Please enter a recipient name."),
  recipientMobile: z.string().trim().min(1, "Please enter a mobile number."),
  address: deliveryAddressSchema,
  isDefault: z.boolean().default(false),
});
export type CustomerAddressInput = z.infer<typeof customerAddressInputSchema>;
